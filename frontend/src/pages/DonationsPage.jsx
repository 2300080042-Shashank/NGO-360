import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiDollarSign, FiHeart } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const DonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [amount, setAmount] = useState('');
  
  // Multi-NGO Donation selection
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState('');

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/api/donations?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (minAmount) url += `minAmount=${encodeURIComponent(minAmount)}&`;
      if (maxAmount) url += `maxAmount=${encodeURIComponent(maxAmount)}&`;

      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNGOsAndCampaigns = async () => {
    try {
      // Fetch verified NGOs list
      const orgsRes = await axios.get(`${API}/api/organizations`);
      setOrganizations(orgsRes.data);
    } catch (err) {
      console.error('Error fetching NGOs/Campaigns list', err);
    }
  };

  useEffect(() => {
    fetchDonations();
    if (user.role === 'donor') {
      fetchNGOsAndCampaigns();
    }
  }, [search, minAmount, maxAmount]);

  // Handle NGO change to fetch its specific campaigns
  const handleOrgChange = async (orgId) => {
    setSelectedOrgId(orgId);
    setSelectedCampId('');
    if (!orgId) {
      setCampaigns([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/campaigns?organizationId=${orgId}`);
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!selectedOrgId) {
      alert("Please select an NGO to receive the donation.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay Checkout SDK. Are you online?");
        return;
      }

      // Create order with NGO and campaign mapping
      const orderRes = await axios.post(`${API}/api/donations/razorpay-order`, {
        amount: Number(amount),
        organizationId: selectedOrgId,
        campaignId: selectedCampId || undefined
      }, {
        headers: { 'x-auth-token': token }
      });

      const { orderId, amount: orderAmount, currency, keyId } = orderRes.data;

      const selectedOrg = organizations.find(o => o._id === selectedOrgId);
      const selectedCamp = campaigns.find(c => c._id === selectedCampId);

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency,
        name: "NGO360 Impact Payments",
        description: selectedCamp ? `Campaign: ${selectedCamp.title}` : `General donation for ${selectedOrg?.name}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await axios.post(`${API}/api/donations/razorpay-verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { 'x-auth-token': token }
            });

            alert(`Payment of ₹${amount} successful! Thank you.`);
            setAmount('');
            setSelectedOrgId('');
            setSelectedCampId('');
            setCampaigns([]);
            fetchDonations();
          } catch (err) {
            console.error(err);
            alert("Payment signature verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: "#6366f1"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to process payment.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Donations & Support Log</h1>
        <p className="text-secondary mt-2">
          {user.role === 'admin' 
            ? 'Track contributions made directly to your registered NGO profile.' 
            : 'Track your personal contributions and donate to verified NGOs.'}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'donor' ? '1.1fr 1.9fr' : '1fr', gap: '24px' }}>
        
        {/* Donation Form (Donors only) */}
        {user.role === 'donor' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: 'fit-content' }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', color: 'var(--success)' }}>
                <FiDollarSign size={24} />
              </div>
              <h3 className="text-xl font-bold">Make a Contribution</h3>
            </div>
            
            <form onSubmit={handleDonate} className="flex-col gap-4">
              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">Choose NGO</label>
                <select 
                  value={selectedOrgId} 
                  onChange={(e) => handleOrgChange(e.target.value)} 
                  required
                >
                  <option value="">Select Partner NGO...</option>
                  {organizations.map(org => (
                    <option key={org._id} value={org._id}>{org.name}</option>
                  ))}
                </select>
              </div>

              {selectedOrgId && (
                <div>
                  <label className="text-xs text-secondary font-semibold mb-2 block">Select Campaign (Optional)</label>
                  <select 
                    value={selectedCampId} 
                    onChange={(e) => setSelectedCampId(e.target.value)}
                  >
                    <option value="">General Donation Fund</option>
                    {campaigns.map(camp => (
                      <option key={camp._id} value={camp._id}>{camp.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">Quick Support</label>
                <div className="flex gap-2 mb-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, border: amount === '500' ? '1px solid var(--accent)' : '1px solid var(--glass-border)' }}
                    onClick={() => setAmount('500')}
                  >
                    ₹500
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, border: amount === '1000' ? '1px solid var(--accent)' : '1px solid var(--glass-border)' }}
                    onClick={() => setAmount('1000')}
                  >
                    ₹1000
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, border: amount === '5000' ? '1px solid var(--accent)' : '1px solid var(--glass-border)' }}
                    onClick={() => setAmount('5000')}
                  >
                    ₹5000
                  </button>
                </div>

                <label className="text-xs text-secondary font-semibold mb-2 block">Or Enter Custom Amount (₹)</label>
                <input 
                  type="number" 
                  min="1" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="e.g. 2500"
                  required 
                />
              </div>

              <button type="submit" className="btn btn-success w-full mt-4 text-base">
                Donate Now
              </button>
            </form>
          </div>
        )}

        {/* Donations List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
          
          {/* Donations Filter Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '12px', 
            marginBottom: '24px',
            background: 'rgba(255,255,255,0.01)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-secondary mb-1 block">Search Project/Donor</label>
              <input 
                type="text" 
                placeholder="Search name or causes..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Min Amount (₹)</label>
              <input 
                type="number" 
                placeholder="Min..." 
                value={minAmount} 
                onChange={e => setMinAmount(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Max Amount (₹)</label>
              <input 
                type="number" 
                placeholder="Max..." 
                value={maxAmount} 
                onChange={e => setMaxAmount(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
          </div>

          {loading ? (
            <p className="text-secondary text-center py-12">Loading transactions logs...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Donor Info</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>NGO / Campaign Cause</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div className="font-semibold">{donation.donorId?.name || 'Anonymous Donor'}</div>
                        <div className="text-xs text-secondary">{donation.donorId?.email}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className="text-success font-bold text-lg">₹{donation.amount}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="flex-col gap-1">
                          {donation.campaignId ? (
                            <span className="badge badge-accent" style={{ display: 'inline-block', fontSize: '11px', padding: '2px 8px' }}>
                              Campaign: {donation.campaignId.title}
                            </span>
                          ) : donation.projectId ? (
                            <span className="badge badge-accent" style={{ display: 'inline-block', fontSize: '11px', padding: '2px 8px' }}>
                              Cause: {donation.projectId}
                            </span>
                          ) : (
                            <span className="text-secondary text-sm">General Cause</span>
                          )}
                          {donation.organizationId && (
                            <div className="text-xs text-secondary mt-1">
                              NGO: {donation.organizationId.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {new Date(donation.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${donation.status === 'Successful' ? 'badge-success' : donation.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                          {donation.status || 'Successful'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No contributions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DonationsPage;
