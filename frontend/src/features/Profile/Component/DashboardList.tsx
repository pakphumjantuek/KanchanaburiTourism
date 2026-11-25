import { BarChart3, ShoppingCart, Users } from "lucide-react";

const Dashboard = () => {
  return <>
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Customers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">3,782</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="text-blue-600" size={24} />
                  </div>
                </div>
                <p className="text-green-600 text-sm font-medium mt-4">↑ 11.01%</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Orders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">5,359</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-amber-600" size={24} />
                  </div>
                </div>
                <p className="text-red-600 text-sm font-medium mt-4">↓ 9.05%</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">$24.5K</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-green-600" size={24} />
                  </div>
                </div>
                <p className="text-green-600 text-sm font-medium mt-4">↑ 8.21%</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="rounded-lg shadow-lg p-8 text-white" style={{ background: 'linear-gradient(to right, #2563eb, #1e40af)' }}>
              <h2 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
              <p className="text-blue-100">
                Manage your Kanchanaburi Travel platform with ease and efficiency.
              </p>
            </div>
          </div>
        </main>
        </>
};

export default Dashboard;
  