import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';

// Native Web Audio Synthesizer (Zero file dependencies)
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('Audio feedback unavailable:', e);
  }
};

// Android RF Device Haptic Vibration Trigger
const triggerErrorVibration = () => {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(150);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }
};

// Safe JWT sub/username decoder
const getUsernameFromJWT = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'OPERATOR';
    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    return decoded.sub || decoded.username || decoded.email || 'OPERATOR';
  } catch (e) {
    return 'OPERATOR';
  }
};

export default function RFPicking() {
  // Workflow Steps: 'LOCATION' | 'BOX' | 'SERIAL' | 'NO_TASKS'
  const [currentStep, setCurrentStep] = useState('LOCATION');

  // Scanner Inputs
  const [locationInput, setLocationInput] = useState('');
  const [boxInput, setBoxInput] = useState('');
  const [serialInput, setSerialInput] = useState('');

  // Verified step values
  const [verifiedLocation, setVerifiedLocation] = useState(null);
  const [verifiedBox, setVerifiedBox] = useState(null);

  // Quick Flash Overlay State for Operator Visual Feedback
  const [flashVerified, setFlashVerified] = useState(null); // 'LOCATION' | 'BOX' | null

  // Active Task Data from FastAPI Backend
  const [task, setTask] = useState(null);

  // Operator & Audit Metrics
  const [lastScan, setLastScan] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [operator, setOperator] = useState('OPERATOR');

  // UI Banner State
  const [status, setStatus] = useState({
    type: 'info',
    message: 'Syncing task status...'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Input Focus Refs
  const locationRef = useRef(null);
  const boxRef = useRef(null);
  const serialRef = useRef(null);

  // Helper: Auth Header Factory
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Helper: Centralized 401 Unauthorized / Token Expired Handler
  const handleAuthError = (err) => {
    if (err.response && err.response.status === 401) {
      playSound('error');
      triggerErrorVibration();
      localStorage.removeItem('token');
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  // Clock & Token Decoding
  useEffect(() => {
    setOperator(getUsernameFromJWT());
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Utility to strip scanner control characters (Enter, Tab, CR, LF)
  const cleanBarcode = (rawInput) => {
    return rawInput.replace(/[\r\n\t]/g, '').trim().toUpperCase();
  };

  // Tolerant property extraction across varied FastAPI payload schemas
  const getTaskLocation = (t) => t?.target_location || t?.location || null;
  const getTaskBox = (t) => t?.target_box || t?.box || null;

  // Sync active task from FastAPI
  const fetchActiveTask = async (maintainStep = false) => {
    setIsLoading(true);
    try {
      const response = await api.get('/rf/location', { headers: getAuthHeader() });
      const data = response.data;

      // Robust check: ensure we have an active location or task_id
      const activeLoc = getTaskLocation(data);
      if (!data || (!data.task_id && !activeLoc)) {
        setTask(null);
        setCurrentStep('NO_TASKS');
        setStatus({ type: 'info', message: 'No remaining picking tasks.' });
        return;
      }

      setTask(data);

      if (!maintainStep) {
        setLocationInput('');
        setBoxInput('');
        setSerialInput('');
        setVerifiedLocation(null);
        setVerifiedBox(null);
        setCurrentStep('LOCATION');
        setStatus({ type: 'info', message: `GO TO LOCATION: ${activeLoc || '---'}` });
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      playSound('error');
      triggerErrorVibration();
      const errDetail = err.response?.data?.detail || 'Failed to sync task data from backend.';
      setStatus({ type: 'error', message: `❌ ${errDetail}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial task on mount
  useEffect(() => {
    fetchActiveTask();
  }, []);

  // Dynamic Focus lock with auto-select
  useEffect(() => {
    if (isLoading || flashVerified) return;
    if (currentStep === 'LOCATION') locationRef.current?.focus();
    if (currentStep === 'BOX') boxRef.current?.focus();
    if (currentStep === 'SERIAL') serialRef.current?.focus();
  }, [currentStep, isLoading, flashVerified]);

  // Handler 1: Scan Location
  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    const cleanLoc = cleanBarcode(locationInput);
    if (!cleanLoc || isLoading) return;

    setIsLoading(true);
    try {
      const response = await api.post(
        '/rf/scan-location',
        { location: cleanLoc },
        { headers: getAuthHeader() }
      );

      if (response.data?.success || response.status === 200) {
        playSound('success');
        setVerifiedLocation(cleanLoc);
        setLastScan({ type: 'LOCATION', value: cleanLoc, time: new Date().toLocaleTimeString(), status: 'SUCCESS' });
        
        // 500ms Visual Flash Confirmation before moving cursor
        setFlashVerified('LOCATION');
        setStatus({ type: 'success', message: '✔ LOCATION VERIFIED' });

        setTimeout(() => {
          setFlashVerified(null);
          setCurrentStep('BOX');
        }, 500);
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      playSound('error');
      triggerErrorVibration();
      const errDetail = err.response?.data?.detail || 'Invalid Location Scanned';
      setLastScan({ type: 'LOCATION', value: cleanLoc, time: new Date().toLocaleTimeString(), status: 'ERROR' });
      setStatus({ type: 'error', message: `❌ ${errDetail}` });

      locationRef.current?.focus();
      locationRef.current?.select();
    } finally {
      setIsLoading(false);
    }
  };

  // Handler 2: Scan Box
  const handleBoxSubmit = async (e) => {
    e.preventDefault();
    const cleanB = cleanBarcode(boxInput);
    if (!cleanB || isLoading || !task) return;

    setIsLoading(true);
    try {
      const response = await api.post(
        '/rf/scan-box',
        {
          task_id: task.task_id,
          box: cleanB
        },
        { headers: getAuthHeader() }
      );

      if (response.data?.success || response.status === 200) {
        playSound('success');
        setVerifiedBox(cleanB);
        setLastScan({ type: 'BOX', value: cleanB, time: new Date().toLocaleTimeString(), status: 'SUCCESS' });
        
        // 500ms Visual Flash Confirmation
        setFlashVerified('BOX');
        setStatus({ type: 'success', message: '✔ BOX VERIFIED' });

        setTimeout(() => {
          setFlashVerified(null);
          setCurrentStep('SERIAL');
        }, 500);
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      playSound('error');
      triggerErrorVibration();
      const errDetail = err.response?.data?.detail || 'Invalid Box Scanned';
      setLastScan({ type: 'BOX', value: cleanB, time: new Date().toLocaleTimeString(), status: 'ERROR' });
      setStatus({ type: 'error', message: `❌ ${errDetail}` });

      boxRef.current?.focus();
      boxRef.current?.select();
    } finally {
      setIsLoading(false);
    }
  };

  // Handler 3: Scan Serial
  const handleSerialSubmit = async (e) => {
    e.preventDefault();
    const cleanSer = cleanBarcode(serialInput);
    if (!cleanSer || isLoading || !task) return;

    setIsLoading(true);
    try {
      const response = await api.post(
        '/rf/scan-serial',
        {
          task_id: task.task_id,
          serial: cleanSer
        },
        { headers: getAuthHeader() }
      );

      if (response.data?.success || response.status === 200) {
        playSound('success');
        setLastScan({ type: 'SERIAL', value: cleanSer, time: new Date().toLocaleTimeString(), status: 'SUCCESS' });
        setSerialInput('');

        const nextTaskData = response.data?.next_task;
        if (nextTaskData) {
          const nextLoc = getTaskLocation(nextTaskData);
          const nextBox = getTaskBox(nextTaskData);

          if (!nextTaskData.task_id && !nextLoc) {
            setTask(null);
            setVerifiedLocation(null);
            setVerifiedBox(null);
            setCurrentStep('NO_TASKS');
            setStatus({ type: 'success', message: '✔ All Picking Completed!' });
          } else {
            setTask(nextTaskData);

            // Stale State Reset Engine
            if (nextLoc === verifiedLocation && nextBox === verifiedBox) {
              setCurrentStep('SERIAL');
              setStatus({ type: 'success', message: `✔ Serial Picked: ${cleanSer}` });
            } else if (nextLoc === verifiedLocation) {
              setBoxInput('');
              setVerifiedBox(null); // Clear stale verified box
              setCurrentStep('BOX');
              setStatus({ type: 'info', message: `✔ Serial Picked. Scan Next Box: ${nextBox || '---'}` });
            } else {
              setLocationInput('');
              setBoxInput('');
              setVerifiedLocation(null); // Clear stale verified location
              setVerifiedBox(null);      // Clear stale verified box
              setCurrentStep('LOCATION');
              setStatus({ type: 'info', message: `✔ Serial Picked. GO TO: ${nextLoc || '---'}` });
            }
          }
        } else {
          setStatus({ type: 'success', message: `✔ Serial Picked: ${cleanSer}` });
          await fetchActiveTask();
        }
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      playSound('error');
      triggerErrorVibration();
      const errDetail = err.response?.data?.detail || 'Invalid / Already Picked Serial';
      setLastScan({ type: 'SERIAL', value: cleanSer, time: new Date().toLocaleTimeString(), status: 'ERROR' });
      setStatus({ type: 'error', message: `❌ ${errDetail}` });

      serialRef.current?.focus();
      serialRef.current?.select();
    } finally {
      setIsLoading(false);
    }
  };

  // Quantities & Metrics
  const totalRequired = task?.required_qty || 0;
  const totalPicked = task?.picked_qty || 0;
  const remainingQty = Math.max(0, totalRequired - totalPicked);
  const progressPercent = totalRequired > 0 ? Math.min(100, (totalPicked / totalRequired) * 100) : 0;

  const activeLocation = verifiedLocation || getTaskLocation(task) || '---';
  const activeBox = verifiedBox || getTaskBox(task) || '---';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 font-mono select-none">
      
      {/* Handheld Terminal Enclosure */}
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Terminal Processing Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/85 z-50 flex flex-col items-center justify-center p-6 space-y-3 backdrop-blur-xs">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-amber-400 font-extrabold text-sm tracking-wider uppercase">Processing Scan...</span>
            <div className="w-3/4 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Header & Clock */}
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${currentStep === 'NO_TASKS' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
            <span className="font-bold tracking-wider text-slate-200">RF PICKING</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>⏱ {currentTime}</span>
            <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded border border-slate-600 font-bold">
              {task?.order_id || task?.order_code || '---'}
            </span>
          </div>
        </div>

        {/* Task Sequence & Operator Metadata */}
        <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex justify-between text-[11px] text-slate-400">
          <span>TASK: <strong className="text-amber-400 font-bold">{task?.task_number || task?.task_index || '---'}</strong></span>
          <span>OP: <strong className="text-slate-200">{task?.picker_name || operator}</strong></span>
        </div>

        {/* Completion Screen View */}
        {currentStep === 'NO_TASKS' ? (
          <div className="p-8 my-auto flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center text-3xl text-emerald-400 shadow-lg shadow-emerald-950/50">
              ✔
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-emerald-400 tracking-wide">ALL PICKING COMPLETED</h2>
              <p className="text-xs text-slate-400">Today's assigned tasks have been finished.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-400 max-w-xs leading-relaxed">
              You may safely place this device back on the charging dock or log out.
            </div>
            <button
              onClick={() => fetchActiveTask()}
              className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition-colors cursor-pointer"
            >
              🔄 Refresh Queue
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Display Section */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2">
              
              {/* Target Location Display with Green Flash Effect */}
              <div className={`p-2.5 rounded border transition-colors duration-300 flex justify-between items-center ${
                flashVerified === 'LOCATION'
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div>
                  <span className={`block text-[10px] uppercase font-bold tracking-wider ${flashVerified === 'LOCATION' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    📍 Target Location
                  </span>
                  <span className={`font-black text-3xl tracking-tight block leading-tight ${flashVerified === 'LOCATION' ? 'text-white' : 'text-amber-400'}`}>
                    {activeLocation}
                  </span>
                </div>
                {task?.next_location && (
                  <div className="text-right border-l border-slate-800 pl-3">
                    <span className="text-slate-500 block text-[9px] uppercase">NEXT LOCATION</span>
                    <span className="text-slate-400 font-bold text-xs block">{task.next_location}</span>
                  </div>
                )}
              </div>

              {/* Target Box Display with Green Flash Effect */}
              <div className={`p-2 rounded border transition-colors duration-300 flex justify-between items-center ${
                flashVerified === 'BOX'
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div>
                  <span className={`block text-[10px] uppercase font-bold ${flashVerified === 'BOX' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    📦 Target Box
                  </span>
                  <span className={`font-extrabold text-lg truncate block ${flashVerified === 'BOX' ? 'text-white' : 'text-sky-400'}`}>
                    {activeBox}
                  </span>
                </div>
                {task?.next_box && (
                  <div className="text-right border-l border-slate-800 pl-3">
                    <span className="text-slate-500 block text-[9px] uppercase">NEXT BOX</span>
                    <span className="text-slate-400 font-bold text-xs block">{task.next_box}</span>
                  </div>
                )}
              </div>

              {/* SKU & Quantities */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">SKU: <strong className="text-slate-100 text-base font-bold">{task?.sku || '---'}</strong></span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                    REMAINING SERIALS: {remainingQty}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-300">Required: <b className="text-slate-100">{totalRequired}</b></span>
                  <span className="text-slate-300">Picked: <b className="text-emerald-400">{totalPicked}</b></span>
                  <span className="text-slate-300">Remaining: <b className="text-amber-400">{remainingQty}</b></span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hardware Scanning Inputs with Enhanced Hardware Attributes */}
            <div className="p-3 space-y-3 flex-1 bg-slate-900">
              
              {/* 1. Location Input */}
              <form onSubmit={handleLocationSubmit} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span className={currentStep === 'LOCATION' ? 'text-emerald-400 font-bold animate-pulse' : ''}>
                    {currentStep === 'LOCATION' ? '▶ SCAN LOCATION' : '1. SCAN LOCATION'}
                  </span>
                  {verifiedLocation && <span className="text-emerald-400 text-[10px]">✔ VERIFIED</span>}
                </div>
                <input
                  ref={locationRef}
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value.toUpperCase())}
                  disabled={currentStep !== 'LOCATION' || isLoading}
                  placeholder={currentStep === 'LOCATION' ? 'Scan Location Barcode...' : activeLocation}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  className={`w-full px-3 py-2.5 rounded font-extrabold text-lg border-2 transition-all outline-none ${
                    currentStep === 'LOCATION'
                      ? 'border-emerald-400 bg-emerald-950/30 text-emerald-100 ring-4 ring-emerald-500/20 animate-pulse'
                      : verifiedLocation
                      ? 'border-emerald-600/50 bg-emerald-950/10 text-emerald-300 opacity-80'
                      : 'border-slate-800 bg-slate-950 text-slate-600'
                  }`}
                />
              </form>

              {/* 2. Box Input */}
              <form onSubmit={handleBoxSubmit} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span className={currentStep === 'BOX' ? 'text-emerald-400 font-bold animate-pulse' : ''}>
                    {currentStep === 'BOX' ? '▶ SCAN BOX' : '2. SCAN BOX'}
                  </span>
                  {verifiedBox && <span className="text-emerald-400 text-[10px]">✔ VERIFIED</span>}
                </div>
                <input
                  ref={boxRef}
                  type="text"
                  value={boxInput}
                  onChange={(e) => setBoxInput(e.target.value.toUpperCase())}
                  disabled={currentStep !== 'BOX' || isLoading}
                  placeholder={currentStep === 'BOX' ? 'Scan Box Label...' : activeBox}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  className={`w-full px-3 py-2.5 rounded font-extrabold text-lg border-2 transition-all outline-none ${
                    currentStep === 'BOX'
                      ? 'border-emerald-400 bg-emerald-950/30 text-emerald-100 ring-4 ring-emerald-500/20 animate-pulse'
                      : verifiedBox
                      ? 'border-emerald-600/50 bg-emerald-950/10 text-emerald-300 opacity-80'
                      : 'border-slate-800 bg-slate-950 text-slate-600'
                  }`}
                />
              </form>

              {/* 3. Serial Input */}
              <form onSubmit={handleSerialSubmit} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span className={currentStep === 'SERIAL' ? 'text-emerald-400 font-bold animate-pulse' : ''}>
                    {currentStep === 'SERIAL' ? '▶ SCAN SERIAL' : '3. SCAN SERIAL'}
                  </span>
                  {currentStep === 'SERIAL' && <span className="text-amber-400 text-[10px]">READY FOR SCAN</span>}
                </div>
                <input
                  ref={serialRef}
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                  disabled={currentStep !== 'SERIAL' || isLoading}
                  placeholder={currentStep === 'SERIAL' ? 'Scan Item Serial Barcode...' : 'Locked'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  className={`w-full px-3 py-2.5 rounded font-extrabold text-lg border-2 transition-all outline-none ${
                    currentStep === 'SERIAL'
                      ? 'border-emerald-400 bg-emerald-950/30 text-emerald-100 ring-4 ring-emerald-500/20 animate-pulse'
                      : 'border-slate-800 bg-slate-950 text-slate-600'
                  }`}
                />
              </form>

              {/* Last Scan Audit Log */}
              {lastScan && (
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">LAST SCAN: <strong className="text-slate-200">{lastScan.type}</strong> ({lastScan.value})</span>
                  <span className={lastScan.status === 'SUCCESS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {lastScan.status} [{lastScan.time}]
                  </span>
                </div>
              )}

            </div>
          </>
        )}

        {/* Dynamic Status / Error Feedback Banner */}
        <div className={`p-3 border-t text-center font-bold text-xs transition-colors duration-200 ${
          status.type === 'success' 
            ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
            : status.type === 'error'
            ? 'bg-rose-950 text-rose-300 border-rose-800 animate-bounce'
            : 'bg-slate-950 text-slate-400 border-slate-800'
        }`}>
          {status.message}
        </div>

        {/* Scanner Hardware Footer Bar */}
        <div className="bg-slate-950 px-4 py-1 border-t border-slate-800 text-[9px] text-slate-500 text-center uppercase tracking-widest">
          Hardware Scanner Mode Active (Zebra / Honeywell / Datalogic)
        </div>

      </div>
    </div>
  );
}