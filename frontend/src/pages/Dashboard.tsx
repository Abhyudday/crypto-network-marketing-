import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, Users, TrendingUp, Gift, LogOut, Copy, 
  ArrowUpRight, ArrowDownLeft, History 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: '', walletAddress: '', txHash: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', walletAddress: '' });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/user/dashboard');
      setDashboardData(data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/transactions/deposit', depositForm);
      toast.success('Deposit request submitted successfully!');
      setShowDepositModal(false);
      setDepositForm({ amount: '', walletAddress: '', txHash: '' });
      fetchDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit deposit');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/transactions/withdrawal', withdrawForm);
      toast.success('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', walletAddress: '' });
      fetchDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit withdrawal');
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${dashboardData?.user?.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.username}</p>
            </div>
            <div className="flex gap-2">
              {user?.isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="btn btn-secondary"
                >
                  Admin Panel
                </button>
              )}
              <button onClick={handleLogout} className="btn btn-secondary">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardData?.user?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <Wallet className="h-10 w-10 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Direct Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.directReferrals || 0}
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yesterday Profit</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.stats?.yesterdayProfitPercent?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bonus</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${dashboardData?.stats?.totalBonus?.toFixed(2) || '0.00'}
                </p>
              </div>
              <Gift className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                <ArrowDownLeft className="h-5 w-5" />
                <span className="font-medium">Deposit</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                <ArrowUpRight className="h-5 w-5" />
                <span className="font-medium">Withdraw</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Referral Link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/register?ref=${dashboardData?.user?.referralCode}`}
                className="input flex-1 text-sm"
              />
              <button onClick={copyReferralLink} className="btn btn-primary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your referral code: <span className="font-mono font-semibold">{dashboardData?.user?.referralCode}</span>
            </p>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Network Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Network Balance (10 levels)</span>
                <span className="font-semibold">${dashboardData?.stats?.totalNetworkBalance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Whole Network Balance</span>
                <span className="font-semibold">${dashboardData?.stats?.totalWholeNetworkBalance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member Level</span>
                <span className="font-semibold text-primary-600">{dashboardData?.user?.level}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            {dashboardData?.recentTransactions?.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.recentTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{tx.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${tx.amount.toFixed(2)}</p>
                      <p className={`text-xs ${
                        tx.status === 'APPROVED' ? 'text-green-600' :
                        tx.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No transactions yet</p>
            )}
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Deposit USDT</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="input"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Wallet Address
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={depositForm.walletAddress}
                  onChange={(e) => setDepositForm({ ...depositForm, walletAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Hash (Optional)
                </label>
                <input
                  type="text"
                  className="input"
                  value={depositForm.txHash}
                  onChange={(e) => setDepositForm({ ...depositForm, txHash: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Submit Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Withdraw USDT</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="input"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: ${dashboardData?.user?.balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={withdrawForm.walletAddress}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, walletAddress: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Submit Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
