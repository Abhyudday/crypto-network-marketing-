import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, ArrowLeft, 
  Check, X, Calendar, Wallet, Settings, Network, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [depositWallet, setDepositWallet] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'members'>('transactions');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [tradingForm, setTradingForm] = useState({
    profitPercent: '',
    tradingDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchData();
    fetchAllUsers();
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

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get('/admin/users?limit=100');
      setAllUsers(data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchMemberDetails = async (userId: string) => {
    try {
      const { data } = await api.get(`/admin/member/${userId}/details`);
      setMemberDetails(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch member details');
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

  const fetchDepositWallet = async () => {
    try {
      const { data } = await api.get('/config/deposit-wallet');
      setDepositWallet(data.walletAddress);
    } catch (error) {
      setDepositWallet('');
    }
  };

  const handleOpenWalletModal = () => {
    fetchDepositWallet();
    setShowWalletModal(true);
  };

  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/config/deposit-wallet', { walletAddress: depositWallet });
      toast.success('Deposit wallet updated successfully!');
      setShowWalletModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update wallet');
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

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Network className="h-4 w-4 inline mr-2" />
              Members Network
            </button>
          </div>
        </div>

        {/* Actions */}
        {activeTab === 'transactions' && (
          <div className="mb-8 flex gap-4">
            <button onClick={() => setShowTradingModal(true)} className="btn btn-primary">
              <Calendar className="h-4 w-4 mr-2" />
              Input Trading Result
            </button>
            <button onClick={handleOpenWalletModal} className="btn btn-secondary">
              <Wallet className="h-4 w-4 mr-2" />
              Configure Deposit Wallet
            </button>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
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
                        <tr 
                          key={tx.id}
                          onClick={() => setSelectedDeposit(tx)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">{tx.user.username}</td>
                          <td className="px-4 py-3 text-sm font-semibold">${tx.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                            {tx.walletAddress?.slice(0, 10)}...
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleApproveDeposit(tx.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleReject(tx.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <X className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setSelectedDeposit(tx)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="View Details"
                              >
                                <Eye className="h-5 w-5" />
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
          </>
        )}

        {/* Members Network Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Search Member</h3>
              <input
                type="text"
                placeholder="Search by username or email..."
                className="input w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Users List */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">All Members</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Deposit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allUsers
                      .filter((user) => 
                        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                              {user.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">${user.balance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">${user.totalDeposit.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => {
                                setSelectedMember(user);
                                fetchMemberDetails(user.id);
                              }}
                              className="btn btn-secondary text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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

      {/* Deposit Wallet Configuration Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary-600" />
              Configure Deposit Wallet
            </h3>
            <form onSubmit={handleUpdateWallet} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Important:</strong> This wallet address will be shown to all users when they make deposits.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Current network: Check your .env file for DEPOSIT_NETWORK and DEPOSIT_TOKEN settings.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Deposit Wallet Address
                </label>
                <input
                  type="text"
                  required
                  className="input font-mono text-sm"
                  placeholder="e.g., 0x... (ETH) or TRX... (TRC20)"
                  value={depositWallet}
                  onChange={(e) => setDepositWallet(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Users will send their deposits to this address
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-700 font-semibold mb-2">💡 Network Configuration</p>
                <p className="text-xs text-gray-600 mb-1">Set in backend .env file:</p>
                <code className="text-xs block bg-white p-2 rounded border mt-1">
                  DEPOSIT_NETWORK=Sepolia Testnet<br/>
                  DEPOSIT_TOKEN=ETH
                </code>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Save Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Details Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Deposit Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="text-base font-semibold">{selectedDeposit.user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-base">{selectedDeposit.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-base font-semibold text-green-600">${selectedDeposit.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-base">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedDeposit.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      selectedDeposit.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedDeposit.status}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Sender Wallet Address</label>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">{selectedDeposit.walletAddress || 'N/A'}</p>
                </div>
                {selectedDeposit.txHash && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">{selectedDeposit.txHash}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-base">{new Date(selectedDeposit.createdAt).toLocaleString()}</p>
                </div>
                {selectedDeposit.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approved At</label>
                    <p className="text-base">{new Date(selectedDeposit.approvedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedDeposit.remarks && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Remarks</label>
                    <p className="text-base">{selectedDeposit.remarks}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                {selectedDeposit.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveDeposit(selectedDeposit.id);
                        setSelectedDeposit(null);
                      }}
                      className="btn btn-primary flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Deposit
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedDeposit.id);
                        setSelectedDeposit(null);
                      }}
                      className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedDeposit(null)}
                  className="btn btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && memberDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">{memberDetails.user.username}</h3>
                <p className="text-gray-600">{memberDetails.user.email}</p>
              </div>
              <button onClick={() => { setSelectedMember(null); setMemberDetails(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Level</p>
                <p className="text-xl font-bold text-blue-600">{memberDetails.user.level}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-xl font-bold text-green-600">${memberDetails.user.balance.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Deposit</p>
                <p className="text-xl font-bold text-purple-600">${memberDetails.user.totalDeposit.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Direct Referrals</p>
                <p className="text-xl font-bold text-orange-600">{memberDetails.directReferrals}</p>
              </div>
            </div>

            {/* Tabs for History */}
            <div className="space-y-6">
              {/* Deposits */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Deposit History ({memberDetails.deposits.length})</h4>
                {memberDetails.deposits.length > 0 ? (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {memberDetails.deposits.map((tx: any) => (
                          <tr key={tx.id}>
                            <td className="px-3 py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 font-semibold">${tx.amount.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                tx.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No deposits yet</p>
                )}
              </div>

              {/* Withdrawals */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Withdrawal History ({memberDetails.withdrawals.length})</h4>
                {memberDetails.withdrawals.length > 0 ? (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {memberDetails.withdrawals.map((tx: any) => (
                          <tr key={tx.id}>
                            <td className="px-3 py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 font-semibold">${tx.amount.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                tx.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No withdrawals yet</p>
                )}
              </div>

              {/* Bonuses */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Bonus History ({memberDetails.bonuses.length})</h4>
                {memberDetails.bonuses.length > 0 ? (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {memberDetails.bonuses.slice(0, 10).map((bonus: any) => (
                          <tr key={bonus.id}>
                            <td className="px-3 py-2">{new Date(bonus.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{bonus.bonusType}</td>
                            <td className="px-3 py-2 font-semibold text-green-600">${bonus.bonusAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No bonuses yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
