using KanjanaburiTravel.Dtos.Auth;
using System.Security.Cryptography;
using TravelKanjanuburi.Dtos.Users;


public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _db;
    private readonly JwtOptions _jwtOptions;
    private const int RefreshTokenDays = 7;

    public AuthService(ApplicationDbContext db, IOptions<JwtOptions> jwtOptions)
    {
        _db = db;
        _jwtOptions = jwtOptions.Value;
    }

    // REGISTER
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
            throw new InvalidOperationException("Email นี้ถูกใช้แล้ว");

        var user = new User
        {
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            DisplayName = request.DisplayName,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            RoleId = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(request.BusinessName))
        {
            _db.OperatorApplications.Add(new OperatorApplication
            {
                UserId = user.UserId,
                BusinessName = request.BusinessName.Trim(),
                ContactPhone = request.PhoneNumber,
                Description = request.BusinessDescription?.Trim()
            });
            await _db.SaveChangesAsync();
        }

        user = await _db.Users.Include(u => u.Role).FirstAsync(u => u.UserId == user.UserId);

        return GenerateAuthResponse(user);
    }

    // LOGIN
    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                u.Email == request.EmailOrPhone ||
                u.PhoneNumber == request.EmailOrPhone);

        if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash) || !user.IsActive)
            throw new UnauthorizedAccessException("อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง");

        var auth = GenerateAuthResponse(user);
        var refreshToken = await CreateRefreshTokenAsync(user.UserId);

        return new LoginResult
        {
            Auth = auth,
            RefreshToken = refreshToken.Token
        };
    }

    // REFRESH
    public async Task<LoginResult> RefreshAsync(string refreshToken)
    {
        var now = DateTime.UtcNow;

        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(r =>
                r.Token == refreshToken &&
                r.RevokedAt == null &&
                r.ExpiresAt > now);

        if (token == null)
            throw new UnauthorizedAccessException("Refresh token ไม่ถูกต้องหรือหมดอายุ");

        var newToken = await CreateRefreshTokenAsync(token.UserId);
        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByToken = newToken.Token;
        await _db.SaveChangesAsync();

        var user = await _db.Users
            .Include(u => u.Role)
            .FirstAsync(u => u.UserId == token.UserId);

        return new LoginResult
        {
            Auth = GenerateAuthResponse(user),
            RefreshToken = newToken.Token
        };
    }

    // LOGOUT / REVOKE
    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var now = DateTime.UtcNow;

        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(r =>
                r.Token == refreshToken &&
                r.RevokedAt == null &&
                r.ExpiresAt > now);

        if (token == null)
            return;

        token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // GENERATE JWT
    private AuthResponse GenerateAuthResponse(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.RoleName)
        };

        var expires = DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponse
        {
            AccessToken = tokenString,
            ExpiresAt = expires,
            User = new UserProfileDto
            {
                UserId = user.UserId,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                RoleName = user.Role.RoleName
            }
        };
    }

    // REFRESH TOKEN HELPERS
    private string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private async Task<RefreshToken> CreateRefreshTokenAsync(int userId)
    {
        var token = new RefreshToken
        {
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
            CreatedAt = DateTime.UtcNow
        };

        _db.RefreshTokens.Add(token);
        await _db.SaveChangesAsync();
        return token;
    }
}
