global using System.IdentityModel.Tokens.Jwt;
global using System.Net;
global using System.Security.Claims;
global using System.Text;
global using AutoMapper;
global using KanjanaburiTravel.Dtos;
global using KanjanaburiTravel.Infrastructure;
global using Microsoft.AspNetCore.Authentication.JwtBearer;
global using Microsoft.AspNetCore.Authorization;
global using Microsoft.AspNetCore.Mvc;
global using Microsoft.EntityFrameworkCore;
global using Microsoft.Extensions.Options;
global using Microsoft.IdentityModel.Tokens;
global using Microsoft.OpenApi.Models;
global using TravelKanjanuburi.Mappings;
global using TravelKanjanuburi.Model;
global using TravelKanjanuburi.Services.Interface;
global using TravelKanjanuburi.Services.Users;
using KanjanaburiTravel.Services.Users;
using Microsoft.Extensions.ML;
using TravelKanjanuburi.Helper;
using TravelKanjanuburi.Middlewares;
using TravelKanjanuburi.ML.Food.FeatureEngineering;
using TravelKanjanuburi.ML.Food.Models;
using TravelKanjanuburi.ML.Food.Prediction;
using TravelKanjanuburi.ML.Food.Training;
using TravelKanjanuburi.ML.Models;
using TravelKanjanuburi.ML.Training;
using TravelKanjanuburi.Services;
using TravelKanjanuburi.Services.FeatureEngineering;
using TravelKanjanuburi.Services.foods;
using TravelKanjanuburi.Services.Images;
using TravelKanjanuburi.Services.Logss;
using TravelKanjanuburi.Services.Places;
using TravelKanjanuburi.Services.Trips;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection("Jwt"));
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddHttpClient("osrm", client =>
{
    // URL ของ OSRM ตั้งได้ที่ appsettings: Osrm:BaseUrl (ควรชี้เซิร์ฟเวอร์ของเราเองตอนใช้งานจริง)
    var osrmBase = (builder.Configuration["Osrm:BaseUrl"] ?? "https://router.project-osrm.org").TrimEnd('/') + "/";
    client.BaseAddress = new Uri(osrmBase);
    client.Timeout = TimeSpan.FromSeconds(10);
    // OSRM สาธารณะตอบ 403 ถ้าไม่มี User-Agent
    client.DefaultRequestHeaders.UserAgent.ParseAdd("KanjanaburiTravel/1.0");
});
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserInterestService, UserInterestService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IFileStorage, LocalFileStorage>();
builder.Services.AddScoped<PlaceService>();
builder.Services.AddScoped<PlaceCategoriesService>();
builder.Services.AddScoped<PlaceTagService>();
builder.Services.AddScoped<TripService>();
builder.Services.AddScoped<BehaviorService>();
builder.Services.AddScoped<IInterestMapper, InterestMapper>();
builder.Services.AddScoped<SeedBehaviorService>();
builder.Services.AddMemoryCache(); // แคช trending อาหาร + การกระจายหมวดต่อผู้ใช้ ใน HomeService
builder.Services.AddScoped<HomeService>();
builder.Services.AddScoped<AutoTripService>();
builder.Services.AddScoped<TravelKanjanuburi.Services.Trips.IPlaceRecommender, TravelKanjanuburi.Services.Trips.CategoryPlaceRecommender>();
builder.Services.AddSingleton<TravelKanjanuburi.Services.Trips.RoadMatrixService>();
builder.Services.AddSingleton<TravelKanjanuburi.Services.Trips.IRoadMatrixProvider>(sp => sp.GetRequiredService<TravelKanjanuburi.Services.Trips.RoadMatrixService>());
builder.Services.AddScoped<PlaceOpeningHourService>();
builder.Services.AddScoped<PlaceReviewService>();
builder.Services.AddScoped<LocalDishService>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<SeedLocalDishService>();

//Place ML
builder.Services.AddScoped<UserFeatureBuilderService>();
builder.Services.AddScoped<TrainingDataBuilderService>();
builder.Services.AddScoped<LightGbmTrainingService>();
builder.Services.AddScoped<TravelKanjanuburi.ML.TrainingStatsService>();
builder.Services.AddScoped<CategoryPredictionService>();
builder.Services.AddScoped<RecommendationService>();
// Food ML
builder.Services.AddScoped<FoodFeatureBuilderService>();
builder.Services.AddScoped<FoodTrainingDataBuilderService>();
builder.Services.AddScoped<FoodLightGbmTrainingService>();
builder.Services.AddScoped<FoodPopularityPredictionService>();

var modelPath = Path.Combine(
    builder.Environment.ContentRootPath,
    "MLModels",
    "category_regression_model.zip");


// FromFile โยน ArgumentException ทันทีที่ resolve pool ถ้าไม่มีไฟล์ จึงลงทะเบียนเฉพาะเมื่อไฟล์มีอยู่
// ผู้ใช้ pool (CategoryPredictionService, RecommendationController) ต้องรับกรณีไม่มี pool ได้ (GetService / พารามิเตอร์ optional)
if (File.Exists(modelPath))
{
    builder.Services
        .AddPredictionEnginePool<UserCategoryRankingData, CategoryRegressionPrediction>()
        .FromFile(modelPath);
}
else
{
    Console.WriteLine("⚠ ML Model not found. Prediction disabled until trained.");
}

var foodModelPath = Path.Combine(
    builder.Environment.ContentRootPath,
    "MLModels",
    "food_popularity_model.zip");

if (File.Exists(foodModelPath))
{
    builder.Services
        .AddPredictionEnginePool<
            FoodPopularityData,
            FoodPopularityPrediction>()
        .FromFile(foodModelPath);

    Console.WriteLine("✅ Food ML Model Loaded");
}
else
{
    Console.WriteLine("⚠ Food ML Model NOT FOUND");
}

builder.Services.Configure<HostOptions>(opt =>
{
    opt.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});


builder.Services.AddEndpointsApiExplorer(); // แนะนำให้มี
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "KanjanaburiTravel API",
        Version = "v1"
    });

    // 🔐 ส่วนนี้สำคัญ: Security Scheme ชื่อ "Bearer"
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "ใส่ JWT แบบ: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "Bearer",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            Array.Empty<string>()
        }
    });
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSection = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection.Issuer,
            ValidAudience = jwtSection.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection.SigningKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",      // dev front
                "https://your-frontend.com"  // ค่า production
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();             // ใช้ cookie ได้
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter());
    });

var app = builder.Build();

app.UseForwardedHeaders();

var pathBase = "/cs67/reactnative/boat";
app.UsePathBase(pathBase);

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/cs67/reactnative/boat/swagger/v1/swagger.json", "RedMango API v1");
    c.RoutePrefix = "swagger";
});

// ใช้ไฟล์สแตติก (ถ้ามีอัปโหลดไฟล์/รูป)
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCors("AllowSpecificOrigins");

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<GlobalExceptionMiddleware>();

app.MapControllers();

app.MapFallbackToFile("index.html");


app.Run();