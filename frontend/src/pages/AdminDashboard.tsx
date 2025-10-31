import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, ArrowLeft, 
  Check, X, Calendar 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [tradingForm, setTradingForm] = useState({
    profitPercent: '',
    tradingDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, depositsRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/deposits/pending'),
        api.get('/admin/withdrawals/pending'),
      ]);
      setStats(statsRes.data);
      setPendingDeposits(depositsRes.data);
      setPendingWithdrawals(withdrawalsRes.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    }
  };

  const handleApproveDeposit = async (id: string) => {
    try {
      await api.post(`/admin/deposits/${id}/approve`);
      toast.success('Deposit approved!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve deposit');
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      await api.post(`/admin/withdrawals/${id}/approve`, { txHash: '' });
      toast.success('Withdrawal approved!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.post(`/admin/transactions/${id}/reject`, { reason });
      toast.success('Transaction rejected!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject transaction');
    }
  };

  const handleSubmitTrading = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/trading-result', tradingForm);
      toast.success('Trading result saved!');
      
      // Ask to distribute profit immediately
      if (window.confirm('Would you like to distribute profit to all users now?')) {
        await api.post(`/admin/trading-result/${data.tradingResult.id}/distribute`);
        toast.success('Profit distributed successfully!');
      }
      
      setShowTradingModal(false);
      setTradingForm({ profitPercent: '', tradingDate: new Date().toISOString().split('T')[0], description: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save trading result');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-10 w-10 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats?.totalBalance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deposits</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats?.totalDeposits?.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-600">
                  ${stats?.totalWithdrawals?.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-red-600 transform rotate-180" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <button onClick={() => setShowTradingModal(true)} className="btn btn-primary">
            <Calendar className="h-4 w-4 mr-2" />
            Input Trading Result
          </button>
        </div>

        {/* Pending Deposits */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Pending Deposits ({pendingDeposits.length})
          </h3>
          {pendingDeposits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingDeposits.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-sm">{tx.user.username}</td>
                      <td className="px-4 py-3 text-sm font-semibold">${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                        {tx.walletAddress?.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveDeposit(tx.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(tx.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No pending deposits</p>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            Pending Withdrawals ({pendingWithdrawals.length})
          </h3>
          {pendingWithdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingWithdrawals.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-sm">{tx.user.username}</td>
                      <td className="px-4 py-3 text-sm font-semibold">${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                        {tx.walletAddress?.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(tx.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReject(tx.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No pending withdrawals</p>
          )}
        </div>
      </main>

      {/* Trading Modal */}
      {showTradingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Input Trading Result</h3>
            <form onSubmit={handleSubmitTrading} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit/Loss Percentage
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="input"
                  placeholder="e.g., 2.5 or -1.5"
                  value={tradingForm.profitPercent}
                  onChange={(e) =>
                    setTradingForm({ ...tradingForm, profitPercent: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trading Date
                </label>
                <input
                  type="date"
                  required
                  className="input"
                  value={tradingForm.tradingDate}
                  onChange={(e) =>
                    setTradingForm({ ...tradingForm, tradingDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={tradingForm.description}
                  onChange={(e) =>
                    setTradingForm({ ...tradingForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTradingModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
