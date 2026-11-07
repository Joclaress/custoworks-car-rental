import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, User, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(fullName, email, phone, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-md">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-black text-xl text-brand-navy">CUSTOWORKS</span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">Book your vehicle & track rental status online</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pl-10 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@example.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pl-10 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Philippine Mobile Number</label>
            <div className="relative">
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0995 382 7972"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pl-10 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters with letter & number"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pl-10 font-medium focus:ring-2 focus:ring-brand-blue focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? 'Creating Account...' : 'Register Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Already registered?{' '}
          <Link to={`/login?redirect=${redirect}`} className="text-brand-blue font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

