import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiHeart, FiTag, FiDollarSign, FiClock, FiCheckSquare, FiArrowLeft } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchCampaign = async () => {
    try {
      const res = await axios.get(`${API}/api/campaigns/${id}`);
      setCampaign(res.data);
    } catch (err) {
      console.error('Error fetching campaign details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

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
    if (!token) {
      alert('Please sign in to donate to campaigns.');
      navigate('/login');
      return;
    }

    if (user.role !== 'donor') {
      alert('Only registered Donors can complete payments. Log in as a Donor to contribute.');
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setDonating(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Check your internet connection.');
        setDonating(false);
        return;
      }

      const orderRes = await axios.post(`${API}/api/donations/razorpay-order`, {
        amount: Number(amount),
        organizationId: campaign.organizationId._id,
        campaignId: campaign._id
      }, {
        headers: { 'x-auth-token': token }
      });

      const { orderId, amount: orderAmount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency,
        name: "NGO360 Campaigns",
        description: `Support Campaign: ${campaign.title}`,
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

            alert(`Thank you for donating ₹${amount}! Your payment was processed successfully.`);
            setAmount('');
            fetchCampaign(); // reload campaign to show updated raised amount
          } catch (err) {
            console.error(err);
            alert('Signature verification failed. Contact platform support.');
          } finally {
            setDonating(false);
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
      alert(err.response?.data?.msg || 'Error setting up Razorpay order.');
      setDonating(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-secondary">Loading campaign details...</div>;
  }

  if (!campaign) {
    return <div className="p-12 text-center text-secondary">Campaign not found.</div>;
  }

  const pct = Math.min(100, Math.round((campaign.amountRaised / campaign.goalAmount) * 100));

  return (
    <div className="animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <Link to="/campaigns" className="flex items-center gap-2 text-secondary mb-6 hover:text-white" style={{ width: 'fit-content' }}>
        <FiArrowLeft /> Back to Campaigns
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        
        {/* Left column: Image, description, NGO reference */}
        <div className="flex-col gap-6">
          <img src={campaign.image} alt={campaign.title} style={{ width: '100%', height: '380px', objectFit: 'cover', borderRadius: '16px', border: '1px solid var(--glass-border)' }} />
          
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-accent"><FiTag /> {campaign.category}</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">{campaign.title}</h1>
            
            <p className="text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{campaign.description}</p>
            
            {campaign.organizationId && (
              <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <img src={campaign.organizationId.logo} alt="" style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                <div>
                  <span className="text-xs text-secondary block">Organized By</span>
                  <Link to={`/ngos/${campaign.organizationId._id}`} className="font-bold text-base text-accent">
                    {campaign.organizationId.name}
                  </Link>
                  <span className="text-xs text-secondary block flex items-center gap-1 mt-0.5"><FiCheckSquare /> Verified Organization</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Progress indicator & Donation checkout form */}
        <div className="flex-col gap-6" style={{ height: 'fit-content' }}>
          
          {/* Progress Card */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 className="text-lg font-bold mb-4">Fundraising Progress</h3>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-extrabold text-success">₹{campaign.amountRaised.toLocaleString()}</span>
              <span className="text-sm text-secondary">of ₹{campaign.goalAmount.toLocaleString()}</span>
            </div>
            
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
            </div>
            
            <div className="flex justify-between text-xs text-secondary mt-2">
              <span>Goal: ₹{campaign.goalAmount.toLocaleString()}</span>
              <span className="font-bold text-accent">{pct}% Raised</span>
            </div>

            {campaign.endDate && (
              <div className="flex items-center gap-2 text-xs text-secondary mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <FiClock /> Deadline: {new Date(campaign.endDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Donation Form */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '10px', color: 'var(--success)' }}>
                <FiDollarSign size={20} />
              </div>
              <h3 className="text-lg font-bold">Donate to this Cause</h3>
            </div>

            {token && user.role !== 'donor' ? (
              <p className="text-sm italic text-secondary">
                You are logged in as a <strong>{user.role}</strong>. Please switch to a Donor account to complete donations.
              </p>
            ) : (
              <form onSubmit={handleDonate} className="flex-col gap-4">
                <div>
                  <label className="text-xs text-secondary font-semibold mb-2 block">Quick Support</label>
                  <div className="flex gap-2 mb-4">
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setAmount('500')}>₹500</button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setAmount('1000')}>₹1000</button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setAmount('5000')}>₹5000</button>
                  </div>

                  <label className="text-xs text-secondary font-semibold mb-2 block">Or Enter Custom Amount (₹)</label>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="Enter amount..." 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-success w-full mt-4 text-base" 
                  disabled={donating}
                >
                  {donating ? 'Connecting to payment...' : 'Support Campaign'}
                </button>
              </form>
            )}

            {!token && (
              <p className="text-xs text-secondary mt-4 text-center">
                Not logged in? <Link to="/login" className="font-semibold text-accent">Sign in</Link> first to contribute.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CampaignDetails;
