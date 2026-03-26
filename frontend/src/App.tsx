import { useState, useEffect } from 'react';
import { Home, Beef, Stethoscope, Users, Grid3X3 } from 'lucide-react';
import { HomeScreen }        from './components/HomeScreen';
import { AnimalRegistry }    from './components/AnimalRegistry';
import { TriageTool }        from './components/TriageTool';
import { VetFinder }         from './components/VetFinder';
import { DiseaseChecker }    from './components/DiseaseChecker';
import { PriceComparison }   from './components/PriceComparison';
import { SupplierLocator }   from './components/SupplierLocator';
import { WeatherAlerts }     from './components/WeatherAlerts';
import { EventLogger }       from './components/EventLogger';
import { CommunityWall }     from './components/CommunityWall';
import { FarmerProfile }     from './components/FarmerProfile';
import { FarmerOnboarding }  from './components/FarmerOnboarding';
import type { AnimalEvent, Farmer, Language, UserLocation, PostCategory } from './types/index';
import { getStoredLang }     from './i18n';
import { getSavedLocation }  from './utils/location';
import './App.css';

type Tab        = 'home' | 'animals' | 'check' | 'community' | 'more';
type MoreScreen = 'diseases' | 'medicines' | 'suppliers' | 'alerts' | 'vets' | 'profile';

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

const MORE_TILES: { id: MoreScreen; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'diseases',  label: 'Diseases',   desc: 'Identify diseases',    color: '#DC2626', bg: '#FEF2F2' },
  { id: 'medicines', label: 'Medicines',  desc: 'Prices & usage',       color: '#0369A1', bg: '#EFF6FF' },
  { id: 'suppliers', label: 'Suppliers',  desc: 'Buy medicines nearby', color: '#D97706', bg: '#FFFBEB' },
  { id: 'alerts',    label: 'Alerts',     desc: 'Seasonal risks',       color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'vets',      label: 'Vets',       desc: 'Find a vet near you',  color: '#2D6A4F', bg: '#D8F3DC' },
  { id: 'profile',   label: 'My Profile', desc: 'Your details',         color: '#52525B', bg: '#F4F4F5' },
];

function getStoredFarmer(): { id: number; name: string } | null {
  const id = localStorage.getItem('pastoral_farmer_id');
  const name = localStorage.getItem('pastoral_farmer_name');
  if (id) return { id: Number(id), name: name ?? '' };
  return null;
}

export default function App() {
  const online = useOnline();

  const [tab, setTab]               = useState<Tab>('home');
  const [moreScreen, setMoreScreen] = useState<MoreScreen | null>(null);
  const [lang, setLang]             = useState<Language>(getStoredLang());

  const storedFarmer = getStoredFarmer();
  const [farmerId,   setFarmerId]   = useState<number | undefined>(storedFarmer?.id);
  const [farmerName, setFarmerName] = useState<string | undefined>(storedFarmer?.name || undefined);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const [location, setLocation] = useState<UserLocation | null>(getSavedLocation);
  const [communityCompose, setCommunityCompose] = useState<PostCategory | null>(null);

  const [logPrefillAnimalId,  setLogPrefillAnimalId]  = useState<number | undefined>();
  const [logPrefillAnimalTag, setLogPrefillAnimalTag] = useState<string | undefined>();
  const [logPrefillData,      setLogPrefillData]      = useState<Partial<AnimalEvent> | undefined>();
  const [showLog,             setShowLog]             = useState(false);
  const [detailAnimalId,      setDetailAnimalId]      = useState<number | undefined>();

  const navigate = (t: Tab) => {
    setTab(t);
    setMoreScreen(null);
    setShowLog(false);
    if (t !== 'community') setCommunityCompose(null);
    if (t !== 'animals')   setDetailAnimalId(undefined);
  };

  const openLog = (animalId?: number, animalTag?: string, data?: Partial<AnimalEvent>) => {
    setLogPrefillAnimalId(animalId);
    setLogPrefillAnimalTag(animalTag);
    setLogPrefillData(data);
    setShowLog(true);
  };

  const closeLog = () => {
    setShowLog(false);
    setLogPrefillAnimalId(undefined);
    setLogPrefillAnimalTag(undefined);
    setLogPrefillData(undefined);
  };

  const handleOnboardingComplete = (farmer: Farmer, loc: UserLocation) => {
    localStorage.setItem('pastoral_farmer_name', farmer.name);
    setFarmerId(farmer.id);
    setFarmerName(farmer.name);
    setLocation(loc);
  };

  const handleOnboardingSkip = (loc: UserLocation) => {
    setLocation(loc);
  };

  const handleFarmerProfileSaved = (farmer: Farmer) => {
    localStorage.setItem('pastoral_farmer_name', farmer.name);
    setFarmerId(farmer.id);
    setFarmerName(farmer.name);
  };

  /* ── Onboarding gate ──────────────────────────────────── */
  if (location === null) {
    return (
      <div className="app">
        <div className="app-main">
          <FarmerOnboarding
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        </div>
      </div>
    );
  }

  /* ── Fullscreen overlays ──────────────────────────────── */
  if (showLog) {
    return (
      <div className="app">
        {!online && <div className="offline-banner">No connection — some features may be unavailable</div>}
        <div className="app-main">
          <EventLogger
            prefillAnimalId={logPrefillAnimalId}
            prefillAnimalTag={logPrefillAnimalTag}
            prefillData={logPrefillData}
            onSaved={closeLog}
            onBack={closeLog}
          />
        </div>
      </div>
    );
  }

  /* ── More sub-screens ─────────────────────────────────── */
  function renderMore() {
    if (moreScreen === 'diseases')  return <DiseaseChecker />;
    if (moreScreen === 'medicines') return <PriceComparison />;
    if (moreScreen === 'suppliers') return <SupplierLocator location={location!} />;
    if (moreScreen === 'alerts')    return <WeatherAlerts />;
    if (moreScreen === 'vets')      return <VetFinder location={location!} />;
    if (moreScreen === 'profile') {
      return (
        <FarmerProfile
          onLangChange={l => { setLang(l); }}
          onLocationSaved={loc => setLocation(loc)}
          onFarmerSaved={handleFarmerProfileSaved}
        />
      );
    }

    return (
      <div style={{ paddingBottom: 16 }}>
        <div style={{ padding: '24px 16px 16px' }}>
          <div className="screen-title">More</div>
          <div className="screen-subtitle">Tools and services</div>
        </div>
        <div className="more-grid">
          {MORE_TILES.map(t => (
            <button key={t.id} className="more-tile" onClick={() => setMoreScreen(t.id)}>
              <div className="more-tile-icon" style={{ background: t.bg }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.color, display: 'block' }} />
              </div>
              <div className="more-tile-label">{t.label}</div>
              <div className="more-tile-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Tab content ──────────────────────────────────────── */
  function renderContent() {
    switch (tab) {
      case 'home':
        return (
          <HomeScreen
            location={location!}
            farmerName={farmerName}
            onCompose={cat => {
              setCommunityCompose(cat ?? null);
              navigate('community');
            }}
            onSeeAll={() => navigate('community')}
            onOpenPost={() => navigate('community')}
            onVets={() => { navigate('more'); setMoreScreen('vets'); }}
            onSuppliers={() => { navigate('more'); setMoreScreen('suppliers'); }}
            onAnimals={() => navigate('animals')}
            onCheck={() => navigate('check')}
            onMore={() => navigate('more')}
            onEditLocation={() => setLocation(null)}
          />
        );

      case 'animals':
        return (
          <div style={{ paddingBottom: 16 }}>
            <AnimalRegistry
              onLogEvent={(id, tag) => openLog(id, tag)}
              onCheckAnimal={() => navigate('check')}
              initialId={detailAnimalId}
            />
          </div>
        );

      case 'check':
        return (
          <TriageTool
            onLogEvent={data => openLog(undefined, undefined, data)}
            onBack={() => navigate('home')}
          />
        );

      case 'community':
        return (
          <CommunityWall
            location={location!}
            farmerId={farmerId}
            initialCompose={communityCompose}
          />
        );

      case 'more':
        return renderMore();

      default:
        return null;
    }
  }

  const isMoreSub = tab === 'more' && moreScreen !== null;

  return (
    <div className="app">
      {!online && <div className="offline-banner">No connection — working offline</div>}

      {/* Back bar for sub-screens */}
      {isMoreSub && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div className="back-bar">
            <button className="back-bar-btn" onClick={() => setMoreScreen(null)}>
              ← Back
            </button>
          </div>
        </div>
      )}

      <main className="app-main">{renderContent()}</main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}>
          <Home size={22} strokeWidth={tab === 'home' ? 2.5 : 1.8} />
          <span className="nav-item-label">Home</span>
        </button>
        <button className={`nav-item ${tab === 'animals' ? 'active' : ''}`} onClick={() => navigate('animals')}>
          <Beef size={22} strokeWidth={tab === 'animals' ? 2.5 : 1.8} />
          <span className="nav-item-label">Animals</span>
        </button>
        <button className={`nav-item ${tab === 'check' ? 'active' : ''}`} onClick={() => navigate('check')}>
          <div className="nav-check-btn" style={tab !== 'check' ? { background: 'var(--brand)', opacity: 0.85 } : {}}>
            <Stethoscope size={22} color="white" strokeWidth={2} />
          </div>
          <span className="nav-item-label">Check</span>
        </button>
        <button className={`nav-item ${tab === 'community' ? 'active' : ''}`} onClick={() => navigate('community')}>
          <Users size={22} strokeWidth={tab === 'community' ? 2.5 : 1.8} />
          <span className="nav-item-label">Community</span>
        </button>
        <button className={`nav-item ${tab === 'more' ? 'active' : ''}`} onClick={() => navigate('more')}>
          <Grid3X3 size={20} strokeWidth={tab === 'more' ? 2.5 : 1.8} />
          <span className="nav-item-label">More</span>
        </button>
      </nav>
    </div>
  );
}
