using TravelKanjanuburi.Dtos.Food;
using TravelKanjanuburi.Dtos.Places;
using TravelKanjanuburi.Dtos.Users;
using TravelKanjanuburi.Model.Foods;
using TravelKanjanuburi.Model.MPlaces;
using TravelKanjanuburi.Model.MPlaces.Reviews;


namespace TravelKanjanuburi.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            //ผู้ใช้ทั่วไป
            CreateMap<User, UserProfileDto>()
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.RoleName));
            CreateMap<UserProfileDto, User>()
            .ForMember(dest => dest.Role, opt => opt.Ignore());

            //สิทธิผู้ดูเเล
            CreateMap<Role, RoleDto>();
            CreateMap<RoleDto, Role>();

            //สถานที่
            CreateMap<Place, PlaceDetailDto>()
                .ForMember(d => d.CategoryName,
                    o => o.MapFrom(s => s.PlaceCategory != null ? s.PlaceCategory.CategoryName : null))
                .ForMember(d => d.TagIds,
                    o => o.MapFrom(s => s.PlaceTags.Select(pt => pt.TagId)))
                .ForMember(d => d.Tags,
                    o => o.MapFrom(s => s.PlaceTags.Select(x => x.Tag.TagName)))
                .ForMember(d => d.Images,
                    o => o.MapFrom(s => s.Images))
                .ForMember(d => d.EventStatus,
                    o => o.MapFrom(s => !s.IsEvent ? null :
                        (s.EventStartAt != null && s.EventStartAt > DateTime.UtcNow ? "upcoming" :
                        (s.EventEndAt != null && s.EventEndAt <= DateTime.UtcNow ? "ended" : "active"))));
            CreateMap<PlaceDetailDto, Place>();

            //เพิ่มสถานที่
            CreateMap<Place, CreatePlaceRequest>();
            CreateMap<CreatePlaceRequest, Place>();
            //เเก้ไขสถานที่
            CreateMap<Place, UpdatePlaceRequest>();
            CreateMap<UpdatePlaceRequest, Place>();

            //ประเภทสถานที่
            CreateMap<PlaceCategory, PlaceCategoriesDto>();
            CreateMap<PlaceCategoriesDto, PlaceCategory>();

            //เเท็คสถานที่
            CreateMap<Tag, TagDto>();
            CreateMap<TagDto, Tag>();

            CreateMap<PlaceImage, PlaceImageDto>();     // ✅ เพิ่มบรรทัดนี้

            //เวลาเปิด-ปิด
            CreateMap<OpeningHour, OpeningHourDto>();
            CreateMap<Place, OpeningHourDto>();

            //คอมเม้น & รีวิว
            CreateMap<PlaceReview, PlaceReviewDto>()
             .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.User.DisplayName));
            CreateMap<PlaceReviewDto, PlaceReview>()
                .ForMember(d => d.User, opt => opt.Ignore());

            //อาหารพื่นถิ่น
            CreateMap<LocalDish, LocalDishDto>()
             .ForMember(d => d.Images,
                    o => o.MapFrom(s => s.LocalDishImages));
            CreateMap<LocalDishDto, LocalDish>();
            CreateMap<LocalDish, CreateLocalDishRequest>();
            CreateMap<CreateLocalDishRequest, LocalDish>()
                .ForMember(d => d.DishId, o => o.Ignore())
                .ForMember(d => d.LocalDishImages, o => o.Ignore());
            CreateMap<LocalDishImage, LocalDishImageDto>();

            CreateMap<Place, PlaceForDishDto>()
                .ForMember(d => d.CoverImageUrl, o => o.MapFrom(s =>
                    s.Images
                        .Where(i => i.IsCover)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                    ?? s.Images
                        .OrderByDescending(i => i.CreatedAt)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                ));
            CreateMap<PlaceLocalDish, DishForPlaceDto>()

                .ForMember(d => d.NameTH, o => o.MapFrom(s => s.LocalDish.NameTH))
                .ForMember(d => d.NameEN, o => o.MapFrom(s => s.LocalDish.NameEN))
                .ForMember(d => d.SpicyLevel, o => o.MapFrom(s => s.LocalDish.SpicyLevel))
                .ForMember(d => d.IsHalal, o => o.MapFrom(s => s.LocalDish.IsHalal))
                .ForMember(d => d.IsVegetarian, o => o.MapFrom(s => s.LocalDish.IsVegetarian))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => s.LocalDish.IsActive))
                .ForMember(d => d.Price, o => o.MapFrom(s => s.Price))
                .ForMember(d => d.IsAvailable, o => o.MapFrom(s => s.IsAvailable))
                .ForMember(d => d.CoverImageUrl, o => o.MapFrom(s =>
                    s.LocalDish.LocalDishImages
                        .Where(i => i.IsCover)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                    ?? s.LocalDish.LocalDishImages
                        .OrderByDescending(i => i.ImageId)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                ));


        }
    }
}
