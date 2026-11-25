namespace TravelKanjanuburi.Mappings
{
    using AutoMapper;
    using TravelKanjanuburi.Dtos.BehaviorLog;
    using TravelKanjanuburi.Dtos.BehaviorLog.TravelKanjanuburi.Dtos.BehaviorLog;
    using TravelKanjanuburi.Model.Log;

    public class RecommendationProfile : Profile
    {
        public RecommendationProfile()
        {
            // Request -> Entity
            CreateMap<CreateBehaviorLogRequest, BehaviorLog>()
                .ForMember(d => d.BehaviorLogId, o => o.Ignore())
                .ForMember(d => d.UserId, o => o.Ignore())       // set จาก token
                .ForMember(d => d.CreatedAt, o => o.Ignore());   // set ใน server

            // Entity/Projection -> DTO (กรณี map จาก Place entity)
            CreateMap<Place, PlaceRecommendDto>()
               .ForMember(d => d.CategoryName,
                   o => o.MapFrom(s => s.PlaceCategory != null ? s.PlaceCategory.CategoryName : null))
               .ForMember(d => d.Tags, o => o.MapFrom(s => s.PlaceTags.Select(x => x.Tag.TagName).ToList()))
               .ForMember(d => d.CoverImageUrl,
                   o => o.MapFrom(s => s.Images
                       .OrderByDescending(i => i.IsCover)
                       .Select(i => i.ImageUrl)
                       .FirstOrDefault()))
               .ForMember(d => d.Score, o => o.Ignore())
               .ForMember(d => d.ReasonJson, o => o.Ignore());
        }
    }

}
