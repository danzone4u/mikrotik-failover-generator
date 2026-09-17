'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RouterOSConfigParams, WANConfig } from '../types/mikrotik';
import { generateRouterOSv7Script, generateFailoverOnlyScript } from '../lib/generator-v7';
import { 
  Activity, 
  Copy, 
  Download, 
  AlertTriangle,
  RefreshCw,
  Terminal,
  Globe,
  Check,
  Lock,
  LogOut,
  MessageCircle,
  Cpu,
  Settings
} from 'lucide-react';

export default function DashboardPage() {
  // Authentication State (PIN: 1122)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Router Identity & Network Params
  const [identity, setIdentity] = useState('ROUTER-MIKROTIK');
  const [adminPassword, setAdminPassword] = useState('');
  const [lanInterface, setLanInterface] = useState('bridge-LAN');
  const [lanIpAddress, setLanIpAddress] = useState('192.168.99.1/24');
  const [enableNat, setEnableNat] = useState(true);
  const [enableFastTrack, setEnableFastTrack] = useState(true);

  // WAN 1 State (Default ether1)
  const [wan1Mode, setWan1Mode] = useState<'dhcp' | 'static'>('dhcp');
  const [wan1Interface, setWan1Interface] = useState('ether1');
  const [wan1Ip, setWan1Ip] = useState('192.168.1.2/24');
  const [wan1Gateway, setWan1Gateway] = useState('192.168.1.1');

  // WAN 2 State (Default ether2 - Selalu Ada)
  const [wan2Mode, setWan2Mode] = useState<'dhcp' | 'static'>('dhcp');
  const [wan2Interface, setWan2Interface] = useState('ether2');
  const [wan2Ip, setWan2Ip] = useState('192.168.2.2/24');
  const [wan2Gateway, setWan2Gateway] = useState('192.168.2.1');

  // Failover Check Mode (Recursive Gateway vs Standard)
  const [useRecursiveGateway, setUseRecursiveGateway] = useState(true);
  const [checkHost1, setCheckHost1] = useState('8.8.8.8');
  const [checkHost2, setCheckHost2] = useState('1.1.1.1');

  // Script Preview Mode Tab: 'full' | 'failover'
  const [scriptTab, setScriptTab] = useState<'full' | 'failover'>('full');

  // UI Toast State
  const [copied, setCopied] = useState(false);

  // Load Auth State from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('mikrotik_app_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Submit PIN Handler
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1122') {
      setIsAuthenticated(true);
      localStorage.setItem('mikrotik_app_auth', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('mikrotik_app_auth');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Build RouterOSConfigParams
  const configParams: RouterOSConfigParams = useMemo(() => {
    const wan1Config: WANConfig = {
      mode: wan1Mode,
      interfaceName: wan1Interface,
      ...(wan1Mode === 'static' ? { ipAddress: wan1Ip, gateway: wan1Gateway } : {})
    };

    const wan2Config: WANConfig = {
      mode: wan2Mode,
      interfaceName: wan2Interface,
      ...(wan2Mode === 'static' ? { ipAddress: wan2Ip, gateway: wan2Gateway } : {})
    };

    return {
      identity,
      adminPassword,
      wan1: wan1Config,
      wan2: wan2Config,
      useRecursiveGateway,
      failoverCheckHost1: checkHost1,
      failoverCheckHost2: checkHost2,
      lanInterface,
      lanIpAddress,
      enableNat,
      enableFastTrack
    };
  }, [
    identity, adminPassword, wan1Mode, wan1Interface, wan1Ip, wan1Gateway,
    wan2Mode, wan2Interface, wan2Ip, wan2Gateway,
    useRecursiveGateway, checkHost1, checkHost2, lanInterface, lanIpAddress, enableNat, enableFastTrack
  ]);

  // Generate Full Script
  const fullScript = useMemo(() => {
    return generateRouterOSv7Script(configParams);
  }, [configParams]);

  // Generate Failover Only Script
  const failoverScript = useMemo(() => {
    return generateFailoverOnlyScript(configParams);
  }, [configParams]);

  // Active Script Displayed
  const activeScript = scriptTab === 'full' ? fullScript : failoverScript;

  // Copy to Clipboard
  const handleCopyScript = () => {
    navigator.clipboard.writeText(activeScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .rsc File
  const handleDownloadScript = () => {
    const blob = new Blob([activeScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanIdentity = identity.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'ROUTER-MIKROTIK';
    const suffix = scriptTab === 'full' ? '' : '_failover';
    link.download = `Mikrotik-${cleanIdentity}${suffix}.rsc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Prevent flicker during initial Auth check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  // Render PIN Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 select-none">
        <div className="max-w-sm w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center backdrop-blur">
          
          <div className="mx-auto w-12 h-12 bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-center text-slate-300">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">MikroTik Deployment Tool</h2>
            <p className="text-xs text-slate-400 mt-1">Masukkan Security PIN untuk mengakses</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError(false);
                }}
                placeholder="• • • •"
                className={`w-full text-center text-2xl tracking-[0.5em] font-mono bg-slate-950 border rounded-xl py-3 text-white focus:outline-none transition-all ${
                  pinError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-800 focus:border-slate-600'
                }`}
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-2 font-medium">PIN Salah. Silakan coba lagi.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-2.5 rounded-xl text-xs transition-all border border-slate-700/60 cursor-pointer"
            >
              Unlock Access
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Developed by{' '}
            <a
              href="https://wa.me/6281336698432"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 font-medium underline underline-offset-4 inline-flex items-center gap-1"
            >
              Dani Abdul Wahid
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 border border-slate-700/60 text-slate-300 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base text-white">MikroTik RouterOS v7 Deployment Tool</h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                v7 Failover
              </span>
            </div>
            <p className="text-xs text-slate-400">WAN1 & WAN2 Dual-Failover Script Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            title="Lock Session"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Form Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">

          {/* 1. System & LAN Params */}
          <section className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-medium text-xs tracking-wider uppercase">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>System & LAN Setup</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">System Identity</label>
                <input
                  type="text"
                  value={identity}
                  onChange={e => setIdentity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Password Admin (Opsional)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tetap"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Interface LAN Router</label>
                <select
                  value={lanInterface}
                  onChange={e => setLanInterface(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="bridge-LAN">bridge-LAN (ether3, ether4, ether5)</option>
                  <option value="ether3">ether3</option>
                  <option value="ether4">ether4</option>
                  <option value="ether5">ether5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">LAN IP Address & Netmask</label>
                <input
                  type="text"
                  value={lanIpAddress}
                  onChange={e => setLanIpAddress(e.target.value)}
                  placeholder="192.168.99.1/24"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="flex items-center gap-6 sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableNat}
                    onChange={e => setEnableNat(e.target.checked)}
                    className="accent-slate-500 w-3.5 h-3.5 rounded"
                  />
                  <span>NAT Masquerade</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableFastTrack}
                    onChange={e => setEnableFastTrack(e.target.checked)}
                    className="accent-slate-500 w-3.5 h-3.5 rounded"
                  />
                  <span>FastTrack Hardware Acceleration</span>
                </label>
              </div>
            </div>
          </section>

          {/* 2. WAN 1 Configuration */}
          <section className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-medium text-xs tracking-wider uppercase">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>WAN 1 (Primary)</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="radio"
                    name="wan1mode"
                    value="dhcp"
                    checked={wan1Mode === 'dhcp'}
                    onChange={() => setWan1Mode('dhcp')}
                    className="accent-slate-400"
                  />
                  <span>DHCP Client</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="radio"
                    name="wan1mode"
                    value="static"
                    checked={wan1Mode === 'static'}
                    onChange={() => setWan1Mode('static')}
                    className="accent-slate-400"
                  />
                  <span>Static IP</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Interface WAN 1</label>
                <select
                  value={wan1Interface}
                  onChange={e => setWan1Interface(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="ether1">ether1 (Default WAN1)</option>
                  <option value="ether2">ether2</option>
                  <option value="sfpplus1">sfpplus1</option>
                </select>
              </div>

              {wan1Mode === 'static' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">IP Address & Netmask</label>
                    <input
                      type="text"
                      value={wan1Ip}
                      onChange={e => setWan1Ip(e.target.value)}
                      placeholder="192.168.1.2/24"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gateway IP</label>
                    <input
                      type="text"
                      value={wan1Gateway}
                      onChange={e => setWan1Gateway(e.target.value)}
                      placeholder="192.168.1.1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 3. WAN 2 Configuration (Selalu Ada) */}
          <section className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-medium text-xs tracking-wider uppercase">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>WAN 2 (Secondary)</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="radio"
                    name="wan2mode"
                    value="dhcp"
                    checked={wan2Mode === 'dhcp'}
                    onChange={() => setWan2Mode('dhcp')}
                    className="accent-slate-400"
                  />
                  <span>DHCP Client</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="radio"
                    name="wan2mode"
                    value="static"
                    checked={wan2Mode === 'static'}
                    onChange={() => setWan2Mode('static')}
                    className="accent-slate-400"
                  />
                  <span>Static IP</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Interface WAN 2</label>
                <select
                  value={wan2Interface}
                  onChange={e => setWan2Interface(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                >
                  <option value="ether2">ether2 (Default WAN2)</option>
                  <option value="ether1">ether1</option>
                  <option value="sfpplus1">sfpplus1</option>
                </select>
              </div>

              {wan2Mode === 'static' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">IP Address & Netmask WAN 2</label>
                    <input
                      type="text"
                      value={wan2Ip}
                      onChange={e => setWan2Ip(e.target.value)}
                      placeholder="192.168.2.2/24"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gateway WAN 2</label>
                    <input
                      type="text"
                      value={wan2Gateway}
                      onChange={e => setWan2Gateway(e.target.value)}
                      placeholder="192.168.2.1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 4. Failover Checking Mode */}
          <section className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-medium text-xs tracking-wider uppercase">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Failover Checking</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={useRecursiveGateway}
                  onChange={e => setUseRecursiveGateway(e.target.checked)}
                  className="accent-slate-400 w-3.5 h-3.5 rounded"
                />
                <span>Recursive Gateway Check</span>
              </label>
            </div>

            {useRecursiveGateway ? (
              <div className="space-y-4 pt-1 border-t border-slate-800/60">
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500/80 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-slate-200">Recursive Gateway Check Active:</strong> Memantau akses internet melalui Host Public (<span className="font-mono text-slate-300">{checkHost1}</span> WAN1 & <span className="font-mono text-slate-300">{checkHost2}</span> WAN2). Otomatis switch jika internet mati walaupun modem/switch lokal tetap UP.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Host Ping WAN 1</label>
                    <input
                      type="text"
                      value={checkHost1}
                      onChange={e => setCheckHost1(e.target.value)}
                      placeholder="8.8.8.8"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Host Ping WAN 2</label>
                    <input
                      type="text"
                      value={checkHost2}
                      onChange={e => setCheckHost2(e.target.value)}
                      placeholder="1.1.1.1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-400">
                Standard Gateway Check Active (Distance 1 WAN1 & Distance 2 WAN2 via check-gateway=ping).
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Live Script Preview & Export (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 flex-1 flex flex-col shadow-sm">
            
            {/* Header & Tabs */}
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs tracking-wide">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>SCRIPT PREVIEW (.rsc)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs px-2.5 py-1.5 rounded-lg text-slate-200 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs px-2.5 py-1.5 rounded-lg text-slate-200 font-medium transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    Download
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setScriptTab('full')}
                  className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all cursor-pointer text-center ${
                    scriptTab === 'full'
                      ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full Config Script
                </button>
                <button
                  onClick={() => setScriptTab('failover')}
                  className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all cursor-pointer text-center ${
                    scriptTab === 'failover'
                      ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Failover Only
                </button>
              </div>
            </div>

            {/* Script Text Box */}
            <div
              suppressHydrationWarning
              className="flex-1 min-h-[460px] bg-slate-950 border border-slate-800/90 rounded-lg p-4 font-mono text-[11px] text-slate-300 overflow-y-auto whitespace-pre leading-relaxed select-all"
            >
              {activeScript}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Credit */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 px-6 mt-auto">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>MikroTik RouterOS v7 Deployment & Failover Tool</div>
          <div className="flex items-center gap-1.5">
            <span>Created by</span>
            <a
              href="https://wa.me/6281336698432"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-slate-100 font-medium underline underline-offset-4 transition-colors inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              Dani Abdul Wahid
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
