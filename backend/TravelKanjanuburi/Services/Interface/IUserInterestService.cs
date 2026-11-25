using TravelKanjanuburi.Dtos.BehaviorLog;
using TravelKanjanuburi.Dtos.Users;
public interface IUserInterestService
{
  Task<List<UserInterestDto>> GetMyInterestsAsync(int userId, CancellationToken ct);
    Task<List<UserInterestDto>> ReplaceMyInterestsAsync(int userId, UpdateUserInterestsRequest request);
    Task<UserInterestDto> UpsertMyInterestAsync(int userId, UserInterestDto item);
    Task DeleteMyInterestAsync(int userId, string interestKey);
    Task<UserInterestDetailsDto> GetAsync(int userId, int days, int top, CancellationToken ct);

}
