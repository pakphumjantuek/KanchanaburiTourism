using TravelKanjanuburi.Dtos.Trips;
using TravelKanjanuburi.Model.MTrips;

namespace TravelKanjanuburi.Features.Trips
{
    public class TripMappingProfile : Profile
    {
        public TripMappingProfile()
        {
            CreateMap<Trip, TripDto>().ReverseMap();
            // ✅ เพิ่มอันนี้
            CreateMap<Trip, TripDetailDto>()
                .IncludeBase<Trip, TripDto>();
            CreateMap<TripItem, TripItemDto>().ReverseMap();
            CreateMap<TripSegment, TripSegmentDto>().ReverseMap();
        }
    }
}
