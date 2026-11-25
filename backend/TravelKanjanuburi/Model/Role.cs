namespace TravelKanjanuburi.Model
{
    public class Role
    {
        public int RoleId { get; set; }            // 1 = Users, 2 = Admin, 3 = Operator (ผู้ประกอบการ)
        public string RoleName { get; set; } = null!;
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
