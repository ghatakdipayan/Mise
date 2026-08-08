import React, { useState, useRef, useEffect } from 'react';
import { analyzeReceiptImage, analyzeFridgeImage } from '../services/geminiService';
import * as swiggyMcp from '../services/swiggyMcp';

interface RefreshHubProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItemsToPantry: (items: { name: string; cat: string; icon: string; qty?: string }[]) => void;
  toast: (msg: string) => void;
  pantryItems: string[]; // List of existing lowercase pantry names
  autoResumeInstamart?: boolean;
  onAutoResumeHandled?: () => void;
}

type ScanSource = 'receipt' | 'photo' | 'connect';
type ScanStage = 'hub' | 'camera' | 'pick' | 'swiggy-connect' | 'scanning' | 'review';

export const RefreshHub: React.FC<RefreshHubProps> = ({
  isOpen,
  onClose,
  onAddItemsToPantry,
  toast,
  pantryItems,
  autoResumeInstamart,
  onAutoResumeHandled,
}) => {
  const [source, setSource] = useState<ScanSource>('receipt');
  const [stage, setStage] = useState<ScanStage>('hub');
  const [connectApp, setConnectApp] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<{ name: string; cat: string; icon: string; qty?: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});
  const [isScanningLoading, setIsScanningLoading] = useState(false);
  const [isSwiggyConnected, setIsSwiggyConnected] = useState(() => swiggyMcp.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoResumeInstamart && isOpen) {
      setIsSwiggyConnected(true);
      handleFetchInstamartOrder();
      onAutoResumeHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResumeInstamart, isOpen]);

  if (!isOpen) return null;

  const APPS = [
    {
      id: 'instamart',
      name: 'Swiggy Instamart',
      color: '#FC8019',
      fg: '#fff',
      initial: 'S',
      sub: isSwiggyConnected ? 'Connected · pulls your real order history' : 'Connect your account for real order history',
      real: true,
    },
    { id: 'blinkit', name: 'Blinkit', color: '#F8CB46', fg: '#1c1c0e', initial: 'b', sub: 'Demo · sample order', real: false },
    { id: 'zepto', name: 'Zepto', color: '#5b2bd6', fg: '#fff', initial: 'Z', sub: 'Demo · sample order', real: false },
    { id: 'amazonfresh', name: 'Amazon Fresh', color: '#1a8676', fg: '#fff', initial: 'a', sub: 'Demo · sample order', real: false },
    { id: 'bigbasket', name: 'BigBasket', color: '#6aa121', fg: '#fff', initial: 'b', sub: 'Demo · sample order', real: false },
  ];

  const APP_DOTS = APPS.map(a => ({ color: a.color, fg: a.fg, initial: a.initial }));

  const ORDERS: Record<string, [string, string, string][]> = {
    blinkit: [['Whole milk', 'Dairy & eggs', 'water_drop'], ['Eggs', 'Dairy & eggs', 'egg'], ['Brown bread', 'Grains & pasta', 'bakery_dining'], ['Bananas', 'Produce', 'nutrition'], ['Butter', 'Dairy & eggs', 'lunch_dining']],
    zepto: [['Baby spinach', 'Produce', 'eco'], ['Bell peppers', 'Produce', 'eco'], ['Greek yogurt', 'Dairy & eggs', 'icecream'], ['Cherry tomatoes', 'Produce', 'nutrition'], ['Lemons', 'Produce', 'nutrition']],
    amazonfresh: [['Olive oil', 'Pantry staples', 'water_drop'], ['Quinoa', 'Grains & pasta', 'grain'], ['Chicken breast', 'Proteins', 'set_meal'], ['Parmesan', 'Dairy & eggs', 'lunch_dining'], ['Almonds', 'Pantry staples', 'grain']],
    bigbasket: [['Basmati rice', 'Grains & pasta', 'rice_bowl'], ['Chickpeas', 'Proteins', 'grain'], ['Cumin', 'Pantry staples', 'grain'], ['Whole wheat atta', 'Grains & pasta', 'grain'], ['Ghee', 'Pantry staples', 'water_drop'], ['Potatoes', 'Produce', 'nutrition']],
  };

  const receiptMockItems: [string, string, string][] = [
    ['Cherry tomatoes', 'Produce', 'nutrition'],
    ['Baby spinach', 'Produce', 'eco'],
    ['Greek yogurt', 'Dairy & eggs', 'icecream'],
    ['Sourdough', 'Grains & pasta', 'bakery_dining'],
    ['Olive oil', 'Pantry staples', 'water_drop'],
    ['Chicken thighs', 'Proteins', 'set_meal'],
    ['Parmesan', 'Dairy & eggs', 'lunch_dining'],
    ['Bananas', 'Produce', 'nutrition'],
  ];

  const photoMockItems: [string, string, string][] = [
    ['Eggs', 'Dairy & eggs', 'egg'],
    ['Whole milk', 'Dairy & eggs', 'water_drop'],
    ['Carrots', 'Produce', 'nutrition'],
    ['Fresh coriander', 'Produce', 'eco'],
    ['Greek yogurt', 'Dairy & eggs', 'icecream'],
    ['Orange juice', 'Drinks', 'water_drop'],
    ['Leftover curry', 'Leftovers', 'lunch_dining'],
    ['Bell pepper', 'Produce', 'eco'],
    ['Butter', 'Dairy & eggs', 'lunch_dining'],
  ];

  const startReceipt = () => {
    setSource('receipt');
    setStage('camera');
  };

  const startPhoto = () => {
    setSource('photo');
    setStage('camera');
  };

  const startConnect = () => {
    setSource('connect');
    setStage('pick');
  };

  const handlePickApp = (appId: string) => {
    setConnectApp(appId);

    if (appId === 'instamart') {
      if (isSwiggyConnected) {
        handleFetchInstamartOrder();
      } else {
        setStage('swiggy-connect');
      }
      return;
    }

    // Demo apps: canned data, clearly labeled as such in the UI.
    setStage('scanning');
    setIsScanningLoading(true);
    setTimeout(() => {
      const items = ORDERS[appId] || [];
      setDetectedItems(items.map(it => ({ name: it[0], cat: it[1], icon: it[2] })));
      const initialSel: Record<number, boolean> = {};
      items.forEach((_, idx) => {
        initialSel[idx] = true;
      });
      setSelectedItems(initialSel);
      setStage('review');
      setIsScanningLoading(false);
    }, 1700);
  };

  const handleConnectSwiggy = async () => {
    setIsConnecting(true);
    try {
      await swiggyMcp.startConnect(); // navigates away to Swiggy's consent page
    } catch (err: any) {
      setIsConnecting(false);
      toast(err.message || 'Could not start Swiggy connection.');
    }
  };

  const handleFetchInstamartOrder = async () => {
    setConnectApp('instamart');
    setSource('connect');
    setStage('scanning');
    setIsScanningLoading(true);
    try {
      const items = await swiggyMcp.fetchRecentInstamartOrders(7);
      setDetectedItems(items);
      const initialSel: Record<number, boolean> = {};
      items.forEach((_, idx) => { initialSel[idx] = true; });
      setSelectedItems(initialSel);
      setStage('review');
    } catch (err: any) {
      toast(err.message || 'Could not fetch your recent Swiggy orders.');
      setStage('pick');
    } finally {
      setIsScanningLoading(false);
    }
  };

  const handleDisconnectSwiggy = () => {
    swiggyMcp.disconnect();
    setIsSwiggyConnected(false);
    toast('Disconnected your Swiggy account');
  };

  const handleSimulateScan = () => {
    setStage('scanning');
    setIsScanningLoading(true);
    setTimeout(() => {
      const mock = source === 'receipt' ? receiptMockItems : photoMockItems;
      setDetectedItems(mock.map(it => ({ name: it[0], cat: it[1], icon: it[2] })));
      const initialSel: Record<number, boolean> = {};
      mock.forEach((_, idx) => {
        initialSel[idx] = true;
      });
      setSelectedItems(initialSel);
      setStage('review');
      setIsScanningLoading(false);
    }, 1900);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStage('scanning');
    setIsScanningLoading(true);

    try {
      let result: { name: string; cat: string; icon: string }[] = [];
      if (source === 'receipt') {
        result = await analyzeReceiptImage(file);
      } else {
        result = await analyzeFridgeImage(file);
      }

      setDetectedItems(result);
      const initialSel: Record<number, boolean> = {};
      result.forEach((_, idx) => {
        initialSel[idx] = true;
      });
      setSelectedItems(initialSel);
      setStage('review');
    } catch (err: any) {
      toast(err.message || 'Error parsing image. Please try again.');
      setStage('camera');
    } finally {
      setIsScanningLoading(false);
    }
  };

  const toggleItem = (idx: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleConfirmScan = () => {
    const itemsToAdd = detectedItems.filter((_, idx) => selectedItems[idx]);
    onAddItemsToPantry(itemsToAdd);
    toast(`${itemsToAdd.length} items added to your pantry`);
    onClose();
  };

  const curApp = APPS.find(a => a.id === connectApp);

  const getAddTitle = () => {
    if (source === 'receipt') return 'Scan receipt';
    if (source === 'photo') return 'Scan your kitchen';
    return curApp ? curApp.name : 'Connect a grocery app';
  };

  const getScanningTitle = () => {
    if (source === 'receipt') return 'Reading your receipt…';
    if (source === 'photo') return 'Recognising items…';
    return curApp ? `Syncing with ${curApp.name}…` : 'Importing your order…';
  };

  const getScanningSub = () => {
    if (source === 'receipt') return 'Matching items to your pantry';
    if (source === 'photo') return 'Looking through your shelves';
    return 'Syncing order history';
  };

  const getReviewTitle = () => {
    if (source === 'photo') return `Spotted ${detectedItems.length} items`;
    if (source === 'connect') return `${detectedItems.length} items found`;
    return `Found ${detectedItems.length} items`;
  };

  const getReviewSub = () => {
    if (source === 'connect' && curApp?.id === 'instamart') {
      return 'From your last 7 days of Instamart orders · untick to skip';
    }
    if (source === 'connect' && curApp) {
      return `From ${curApp.name} · untick to skip`;
    }
    return 'Untick anything you don’t want to add';
  };

  const selectedCount = detectedItems.filter((_, idx) => selectedItems[idx]).length;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {stage === 'hub' ? (
        // ===================== REFRESH HUB MAIN DRAWER =====================
        <div
          onClick={onClose}
          className="absolute inset-0 z-[45] bg-[rgba(15,20,17,0.42)] flex items-end lg:items-center lg:justify-center animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full lg:max-w-md bg-[var(--bg,#fff)] rounded-t-[26px] lg:rounded-[26px] p-[10px_22px_30px] animate-sheet-up"
          >
            {/* Handle */}
            <div className="w-[38px] h-[5px] rounded-full bg-[var(--line,#eceeea)] mx-auto mb-4" />

            <h2 className="font-head text-[22px] font-bold text-[var(--text,#15201a)]">Refresh your pantry</h2>
            <p className="text-[14px] text-[var(--muted,#717c75)] mt-[3px]">Pick how you’d like to add what’s new</p>

            <div className="mt-[18px] flex flex-col gap-[11px]">
              {/* Receipt Button */}
              <button
                onClick={startReceipt}
                className="w-full text-left cursor-pointer flex items-center gap-[14px] p-3.5 rounded-[18px] border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
              >
                <div className="w-[48px] h-[48px] flex-none rounded-[14px] bg-[var(--accent-soft,#e6f4ec)] flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '25px', color: 'var(--accent,#15a85b)' }}>
                    receipt_long
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[16px]">Scan or upload a receipt</div>
                  <div className="text-[13px] text-[var(--muted,#717c75)] mt-[1px]">Snap a printed receipt or choose a photo</div>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--muted,#9aa39c)' }}>
                  chevron_right
                </span>
              </button>

              {/* Connect Grocery App Button */}
              <button
                onClick={startConnect}
                className="w-full text-left cursor-pointer flex items-center gap-[14px] p-3.5 rounded-[18px] border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
              >
                <div className="w-[48px] h-[48px] flex-none rounded-[14px] bg-[var(--accent-soft,#e6f4ec)] flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '25px', color: 'var(--accent,#15a85b)' }}>
                    storefront
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[16px]">Connect a grocery app</div>
                  <div className="text-[13px] text-[var(--muted,#717c75)] mt-[1px]">Import your latest order automatically</div>
                  <div className="flex gap-[4px] mt-2">
                    {APP_DOTS.map((d, i) => (
                      <span
                        key={i}
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-extrabold font-head"
                        style={{ backgroundColor: d.color, color: d.fg }}
                      >
                        {d.initial}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--muted,#9aa39c)' }}>
                  chevron_right
                </span>
              </button>

              {/* Fridge Camera Button */}
              <button
                onClick={startPhoto}
                className="w-full text-left cursor-pointer flex items-center gap-[14px] p-3.5 rounded-[18px] border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
              >
                <div className="w-[48px] h-[48px] flex-none rounded-[14px] bg-[var(--accent-soft,#e6f4ec)] flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '25px', color: 'var(--accent,#15a85b)' }}>
                    photo_camera
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[16px]">Snap your fridge or pantry</div>
                  <div className="text-[13px] text-[var(--muted,#717c75)] mt-[1px]">Point your camera and we’ll spot what’s inside</div>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--muted,#9aa39c)' }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ===================== DETAIL STAGES (receipt/photo/connect) =====================
        <div
          onClick={onClose}
          className="absolute inset-0 z-40 bg-transparent lg:bg-black/40 flex items-center justify-center animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full lg:max-w-2xl lg:h-[90%] lg:rounded-[26px] lg:shadow-2xl bg-[#0e1411] flex flex-col animate-pop-in"
          >
          {/* Header */}
          <div className="p-[14px_22px_0] flex items-center justify-between text-white flex-none">
            <button
              onClick={() => setStage('hub')}
              className="w-[42px] h-[42px] rounded-full border-none bg-white/10 cursor-pointer flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                arrow_back
              </span>
            </button>
            <span className="text-[15px] font-bold">{getAddTitle()}</span>
            <div className="w-[42px]" />
          </div>

          {/* stage === 'camera' (For receipt or photo) */}
          {stage === 'camera' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {source === 'receipt' ? (
                // Receipt Frame
                <div className="w-[230px] h-[330px] rounded-[14px] bg-gradient-to-br from-[#f7f4ec] to-[#e7e2d4] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 p-[18px_16px] font-mono text-[#9a9486] text-[8.5px] leading-[1.9]">
                    <div className="text-center text-[11px] text-[#6f6a5d] tracking-[2px]">GROCER &amp; CO</div>
                    <div className="border-t border-dashed border-[#c4bdae] my-2" />
                    <div className="flex justify-between"><span>CHERRY TOMATO</span><span>3.40</span></div>
                    <div className="flex justify-between"><span>BABY SPINACH</span><span>2.10</span></div>
                    <div className="flex justify-between"><span>GREEK YOGURT</span><span>4.25</span></div>
                    <div className="flex justify-between"><span>SOURDOUGH</span><span>5.00</span></div>
                    <div className="flex justify-between"><span>OLIVE OIL</span><span>9.80</span></div>
                    <div className="flex justify-between"><span>CHICKEN THIGH</span><span>7.60</span></div>
                    <div className="flex justify-between"><span>PARMESAN</span><span>6.40</span></div>
                    <div className="flex justify-between"><span>BANANAS</span><span>1.90</span></div>
                  </div>
                  <div className="absolute left-[5%] right-[5%] h-[2px] bg-[#7bd88f] shadow-[0_0_14px_2px_#7bd88f] animate-[ppl-scanline_2.6s_ease-in-out_infinite]" />
                  <div className="absolute inset-3.5 border-2 border-[#7bd88f]/50 rounded-[8px]" />
                </div>
              ) : (
                // Fridge Frame
                <div className="w-[262px] h-[340px] rounded-[18px] bg-gradient-to-br from-[#e3e9e5] to-[#aeb9b3] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
                  <div className="absolute left-0 right-0 top-[32%] h-[2px] bg-white/45" />
                  <div className="absolute left-0 right-0 top-[64%] h-[2px] bg-white/45" />
                  <div className="absolute left-[20px] top-[6%] w-[30px] h-[58px] rounded-[6px_6px_4px_4px] bg-[#cf6b4a]" />
                  <div className="absolute left-[58px] top-[9%] w-[34px] h-[48px] rounded-[5px] bg-[#e7c14a]" />
                  <div className="absolute right-[24px] top-[7%] w-[46px] h-[52px] rounded-[7px] bg-[#7ea25c]" />
                  <div className="absolute left-[26px] top-[40%] w-[52px] h-[40px] rounded-[6px] bg-[#d9d2c4]" />
                  <div className="absolute left-[96px] top-[39%] w-[40px] h-[44px] rounded-[6px] bg-[#c25b5b]" />
                  <div className="absolute right-[28px] top-[41%] w-[38px] h-[40px] rounded-[6px] bg-[#6f8fb0]" />
                  <div className="absolute left-[30px] top-[72%] w-[60px] h-[34px] rounded-[6px] bg-[#8a6e54]" />
                  <div className="absolute right-[30px] top-[71%] w-[48px] h-[38px] rounded-[6px] bg-[#caa86a]" />
                  <div className="absolute left-[5%] right-[5%] h-[2px] bg-[#7bd88f] shadow-[0_0_14px_2px_#7bd88f] animate-[ppl-scanline_2.6s_ease-in-out_infinite]" />
                  <div className="absolute inset-3.5 border-2 border-[#7bd88f]/55 rounded-[10px]" />
                  <div className="absolute left-[14px] bottom-3 font-mono text-[10px] color-[#3f4a44] opacity-60">fridge interior</div>
                </div>
              )}

              <p className="color-white/75 text-[14.5px] mt-[22px] text-center max-w-[240px]">
                {source === 'receipt'
                  ? 'Line up your receipt inside the frame'
                  : 'Point at an open shelf — we’ll spot what’s inside'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-5 items-center">
                {/* Capture (Simulation) Button */}
                <button
                  onClick={handleSimulateScan}
                  className="w-[72px] h-[72px] rounded-full border-[5px] border-white/35 bg-white cursor-pointer flex items-center justify-center active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '30px', color: '#0e1411' }}>
                    {source === 'receipt' ? 'document_scanner' : 'photo_camera'}
                  </span>
                </button>

                {/* Real File Upload Button */}
                <button
                  onClick={handleFileUploadClick}
                  className="bg-white/12 border-none cursor-pointer text-white font-semibold text-[14px] p-[10px_18px] rounded-full flex items-center gap-[7px] hover:bg-white/20 transition-all mt-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                    photo_library
                  </span>
                  Upload from gallery
                </button>
              </div>
            </div>
          )}

          {/* stage === 'pick' (Connecting app list) */}
          {stage === 'pick' && (
            <div className="flex-1 min-h-0 bg-[var(--bg,#fff)] rounded-t-[24px] mt-[10px] flex flex-col animate-sheet-up">
              <div className="p-[22px_22px_6px]">
                <h2 className="font-head text-[23px] font-bold text-[var(--text,#15201a)]">Connect a grocery app</h2>
                <p className="text-[14px] text-[var(--muted,#717c75)] mt-[3px]">We’ll import what you recently ordered</p>
              </div>
              <div className="ppl-scroll flex-1 min-h-0 overflow-y-auto p-[10px_22px_26px] flex flex-col gap-[10px]">
                {APPS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handlePickApp(a.id)}
                    className="w-full text-left cursor-pointer flex items-center gap-[14px] p-[12px_14px] rounded-[16px] border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
                  >
                    <div
                      className="w-[46px] h-[46px] flex-none rounded-[13px] flex items-center justify-center font-head font-extrabold text-[22px]"
                      style={{ backgroundColor: a.color, color: a.fg }}
                    >
                      {a.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[6px]">
                        <span className="font-bold text-[16px] text-[var(--text,#15201a)]">{a.name}</span>
                        {a.real && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--accent-ink,#0d7a41)] bg-[var(--accent-soft,#e6f4ec)] px-[6px] py-[1px] rounded-full">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-[var(--muted,#717c75)]">{a.sub}</div>
                    </div>
                    {a.id === 'instamart' && isSwiggyConnected ? (
                      <span className="material-symbols-outlined" style={{ color: 'var(--accent,#15a85b)' }}>check_circle</span>
                    ) : a.real ? (
                      <span className="material-symbols-outlined" style={{ color: 'var(--muted,#9aa39c)' }}>chevron_right</span>
                    ) : (
                      <span className="text-[12.5px] font-bold text-[var(--muted,#717c75)] bg-[var(--surface-2,#f4f7f3)] p-[5px_10px] rounded-full">
                        {ORDERS[a.id]?.length || 0} items
                      </span>
                    )}
                  </button>
                ))}
                {isSwiggyConnected && (
                  <button
                    onClick={handleDisconnectSwiggy}
                    className="text-[12.5px] font-semibold text-[var(--muted,#9aa39c)] hover:text-[var(--text,#15201a)] cursor-pointer bg-transparent border-none self-center mt-1"
                  >
                    Disconnect Swiggy account
                  </button>
                )}
                <div className="flex items-center gap-[8px] justify-center mt-2 text-[var(--muted,#717c75)] text-[12.5px] text-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    lock
                  </span>
                  Swiggy Instamart is a real connection · everything else here is sample data
                </div>
              </div>
            </div>
          )}

          {/* stage === 'swiggy-connect' (One-time OAuth consent) */}
          {stage === 'swiggy-connect' && (
            <div className="flex-1 min-h-0 bg-[var(--bg,#fff)] rounded-t-[24px] mt-[10px] flex flex-col animate-sheet-up">
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div
                  className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center font-head font-extrabold text-[28px] mb-5"
                  style={{ backgroundColor: '#FC8019', color: '#fff' }}
                >
                  S
                </div>
                <h2 className="font-head text-[21px] font-bold text-[var(--text,#15201a)]">Connect your Swiggy account</h2>
                <p className="text-[14px] text-[var(--muted,#717c75)] mt-2 max-w-[280px]">
                  You'll sign in on Swiggy's own page with your phone number and OTP. Mise never sees your credentials —
                  we only use this to read your last 7 days of Instamart orders.
                </p>
                <p className="text-[12px] text-[var(--muted,#9aa39c)] mt-3 max-w-[280px]">
                  One-time setup · you can disconnect anytime from this screen
                </p>
              </div>
              <div className="p-[14px_22px_28px] border-t border-[var(--line,#eceeea)] flex-none bg-[var(--bg,#fff)] flex flex-col gap-2.5">
                <button
                  onClick={handleConnectSwiggy}
                  disabled={isConnecting}
                  className={`w-full h-[56px] border-none rounded-full text-white font-bold text-[16.5px] cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isConnecting ? 'opacity-60' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: '#FC8019' }}
                >
                  {isConnecting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Continue to Swiggy'
                  )}
                </button>
                <button
                  onClick={() => setStage('pick')}
                  className="w-full h-[46px] border-none rounded-full bg-transparent text-[var(--muted,#717c75)] font-semibold text-[14.5px] cursor-pointer"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {/* stage === 'scanning' (Spinner loader) */}
          {stage === 'scanning' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
              <div className="w-[58px] h-[58px] rounded-full border-4 border-white/18 border-t-[#7bd88f] animate-spin" />
              <p className="text-[18px] font-bold mt-[22px]">{getScanningTitle()}</p>
              <p className="text-[14px] text-white/60 mt-[6px]">{getScanningSub()}</p>
            </div>
          )}

          {/* stage === 'review' (Items list select confirmation) */}
          {stage === 'review' && (
            <div className="flex-1 min-h-0 bg-[var(--bg,#fff)] rounded-t-[24px] mt-2.5 flex flex-col animate-sheet-up">
              <div className="p-[20px_22px_12px] flex-none">
                <h2 className="font-head text-[23px] font-bold text-[var(--text,#15201a)]">{getReviewTitle()}</h2>
                <p className="text-[14px] text-[var(--muted,#717c75)] mt-[3px]">{getReviewSub()}</p>
              </div>

              {/* Items List scroll container */}
              <div className="ppl-scroll flex-1 min-h-0 overflow-y-auto px-[22px]">
                {detectedItems.map((item, idx) => {
                  const isChecked = selectedItems[idx] !== false;
                  const itemExists = pantryItems.includes(item.name.toLowerCase());
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleItem(idx)}
                      className="w-full text-left cursor-pointer flex items-center gap-[13px] p-[13px_4px] border-b border-[var(--line,#eceeea)] bg-transparent hover:opacity-80 transition-all"
                    >
                      {/* Checkbox box */}
                      <span
                        className="w-[26px] h-[26px] flex-none rounded-[8px] border-2 flex items-center justify-center"
                        style={{
                          borderColor: isChecked ? 'var(--accent,#15a85b)' : 'var(--line,#cfd6cd)',
                          backgroundColor: isChecked ? 'var(--accent,#15a85b)' : 'transparent',
                        }}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fff', fontVariationSettings: "'wght' 600" }}>
                            check
                          </span>
                        )}
                      </span>

                      {/* Icon */}
                      <div className="w-[40px] h-[40px] flex-none rounded-[11px] bg-[var(--surface-2,#f5f8f4)] flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: '21px', color: 'var(--muted,#717c75)' }}>
                          {item.icon}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-bold text-[15.5px] truncate flex items-center gap-[6px]"
                          style={{ color: isChecked ? 'var(--text,#15201a)' : 'var(--muted,#9aa39c)' }}
                        >
                          <span className="truncate">{item.name}</span>
                          {item.qty && Number(item.qty) > 1 && (
                            <span className="flex-none text-[12px] font-extrabold text-[var(--accent-ink,#0d7a41)] bg-[var(--accent-soft,#e6f4ec)] px-[7px] py-[1px] rounded-full">
                              ×{item.qty}
                            </span>
                          )}
                        </div>
                        <div className="text-[12.5px] text-[var(--muted,#717c75)]">{item.cat}</div>
                      </div>

                      {/* Exists tag */}
                      <span
                        className="text-[12px] font-bold p-[4px_9px] rounded-full"
                        style={{
                          color: itemExists ? 'var(--accent-ink,#0d7a41)' : '#b4791f',
                          backgroundColor: itemExists ? 'var(--accent-soft,#e6f4ec)' : '#fbeede',
                        }}
                      >
                        {itemExists ? 'Restock' : 'New'}
                      </span>
                    </button>
                  );
                })}
                <div className="h-[14px]" />
              </div>

              {/* Confirm footer */}
              <div className="p-[14px_22px_28px] border-t border-[var(--line,#eceeea)] flex-none bg-[var(--bg,#fff)]">
                <button
                  onClick={handleConfirmScan}
                  className="w-full h-[56px] border-none rounded-full bg-[var(--accent,#15a85b)] text-white font-bold text-[16.5px] cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Add {selectedCount} items to pantry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
};
