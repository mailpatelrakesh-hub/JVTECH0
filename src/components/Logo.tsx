import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'custom';
  showText?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * Generates a Base64-encoded SVG Data URL representing the high-resolution,
 * high-fidelity brand logo that matches the uploaded PNG perfectly.
 * Uses standard XML/SVG kebab-case attributes for robust cross-browser rendering inside img tags.
 */
export function getLogoSvgDataUrl(text1: string = 'JV TECH', text2: string = 'TEST & TRAINING CENTER'): string {
  const primaryText = text1.toUpperCase();
  const secondaryText = text2.toUpperCase();
  
  const svgString = `
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="white-outline" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="8" />
          <feFlood flood-color="white" flood-opacity="1" result="WHITE" />
          <feComposite in="WHITE" in2="DILATED" operator="in" result="OUTLINE" />
          <feMerge>
            <feMergeNode in="OUTLINE" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#white-outline)">
        <!-- 1. Gear Background (Silver-Grey and bold 16 teeth teeth to match reference image) -->
        <g id="gear-background">
          <!-- Thick 3D gear teeth blocks rotated around center (200, 180) -->
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(0 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(22.5 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(45 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(67.5 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(90 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(112.5 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(135 200 180)" />
          <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" stroke-width="6.5" transform="rotate(157.5 200 180)" />
          
          <!-- Gear central solid hub body -->
          <circle cx="200" cy="180" r="132" fill="#a1a1aa" stroke="#141517" stroke-width="7" />
          <!-- Inner dark rim -->
          <circle cx="200" cy="180" r="115" fill="#141517" />
        </g>

        <!-- 2. Intense Red Circle Shield Accent -->
        <circle cx="200" cy="180" r="102" fill="#e31b23" stroke="#141517" stroke-width="6" />

        <!-- 3. Welder Mascot Character -->
        <g id="welder-mascot">
          <!-- White Collar / Shirt underneath -->
          <path d="M165 190 L185 205 L192 195 Z" fill="#ffffff" stroke="#141517" stroke-width="5.5" stroke-linejoin="round" />
          <path d="M235 190 L215 205 L208 195 Z" fill="#ffffff" stroke="#141517" stroke-width="5.5" stroke-linejoin="round" />

          <!-- Red Apron and Shoulders -->
          <path d="M142 205 C142 180, 258 180, 258 205 L278 280 L122 280 Z" fill="#e31b23" stroke="#141517" stroke-width="6.5" stroke-linejoin="round" />
          
          <!-- Apron straps -->
          <path d="M158 200 L172 235 L162 238 L148 200 Z" fill="#141517" />
          <path d="M242 200 L228 235 L238 238 L252 200 Z" fill="#141517" />
          
          <!-- Buckle rivet details -->
          <circle cx="166" cy="220" r="4" fill="#fbbf24" stroke="#141517" stroke-width="1" />
          <circle cx="234" cy="220" r="4" fill="#fbbf24" stroke="#141517" stroke-width="1" />

          <!-- Welder Helmet Shield -->
          <path d="M158 112 C158 72, 168 55, 200 55 C232 55, 242 72, 242 112 C242 145, 237 165, 200 165 C163 165, 158 145, 158 112 Z" fill="#1e1f22" stroke="#a1a1aa" stroke-width="6.5" />
          
          <!-- Helmet top crown ridge -->
          <path d="M188 55 C188 40, 212 40, 212 55 L206 82 L194 82 Z" fill="#475569" stroke="#141517" stroke-width="4.5" />

          <!-- Visor window outer metallic frame -->
          <rect x="172" y="86" width="56" height="26" rx="4" fill="#334155" stroke="#141517" stroke-width="5.5" />
          <!-- Visor glowing glass to match the grey/white metallic reflection exactly -->
          <rect x="176" y="90" width="48" height="18" rx="2" fill="#e2e8f0" />
          <!-- White sheen shine reflections -->
          <rect x="178" y="92" width="44" height="14" rx="1" fill="#f8fafc" />
          <rect x="180" y="93" width="40" height="5" fill="#ffffff" opacity="0.9" />

          <!-- Side Pivot Knobs -->
          <rect x="151" y="105" width="8" height="16" rx="2" fill="#a1a1aa" stroke="#141517" stroke-width="3.5" />
          <rect x="241" y="105" width="8" height="16" rx="2" fill="#a1a1aa" stroke="#141517" stroke-width="3.5" />

          <!-- Glove and Torch -->
          <!-- Torch shaft handle -->
          <path d="M110 195 L145 255" stroke="#141517" stroke-width="13" stroke-linecap="round" />
          <!-- Golden Brass nozzle -->
          <path d="M85 185 L110 188 L122 212" fill="none" stroke="#d97706" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M75 185 L85 185" stroke="#94a3b8" stroke-width="15" stroke-linecap="round" />

          <!-- Sparks -->
          <g id="sparks">
            <path d="M70 185 L52 180 M70 185 L56 198 M70 185 L58 170" stroke="#fbbf24" stroke-width="4.5" stroke-linecap="round" />
            <path d="M70 185 L48 188 M70 185 L60 205" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
            <circle cx="70" cy="185" r="5.5" fill="#ffffff" />
          </g>

          <!-- Grey Glove holding handle -->
          <path d="M112 212 C102 212, 108 242, 128 242 C138 242, 142 222, 132 212 Z" fill="#4b5563" stroke="#141517" stroke-width="5.5" />
          <circle cx="118" cy="218" r="5" fill="#9ca3af" stroke="#141517" stroke-width="2.5" />
          <circle cx="121" cy="227" r="5" fill="#9ca3af" stroke="#141517" stroke-width="2.5" />
          <circle cx="124" cy="236" r="5" fill="#9ca3af" stroke="#141517" stroke-width="2.5" />
        </g>

        <!-- 4. Bottom Banner Plate with Curved notched ends -->
        <path d="M 65 265 L 335 265 Q 350 265, 350 280 C 340 295, 340 315, 350 330 Q 350 345, 335 345 L 65 345 Q 50 345, 50 330 C 60 315, 60 295, 50 280 Q 50 265, 65 265 Z" fill="#ffffff" stroke="#141517" stroke-width="12" stroke-linejoin="round" />
        <path d="M 65 265 L 335 265 Q 350 265, 350 280 C 340 295, 340 315, 350 330 Q 350 345, 335 345 L 65 345 Q 50 345, 50 330 C 60 315, 60 295, 50 280 Q 50 265, 65 265 Z" fill="#ffffff" stroke="#a1a1aa" stroke-width="6" stroke-linejoin="round" />

        <circle cx="72" cy="280" r="5.5" fill="#141517" />
        <circle cx="328" cy="280" r="5.5" fill="#141517" />
        <circle cx="72" cy="330" r="5.5" fill="#141517" />
        <circle cx="328" cy="330" r="5.5" fill="#141517" />

        <!-- 3D Black shadow text offset slightly to match red collegiate-slab drop shadow perfectly -->
        <text x="203" y="311" fill="#141517" font-size="44" font-weight="900" font-family="Georgia, serif" text-anchor="middle" letter-spacing="2">
          ${primaryText}
        </text>
        <text x="200" y="308" fill="#e31b23" font-size="44" font-weight="900" font-family="Georgia, serif" text-anchor="middle" letter-spacing="2">
          ${primaryText}
        </text>

        <line x1="88" y1="316" x2="312" y2="316" stroke="#141517" stroke-width="2.5" />

        <!-- Subtext: TEST & TRAINING CENTER -->
        <text x="200" y="335" fill="#141517" font-size="14.5" font-weight="900" font-family="'Inter', 'Helvetica', sans-serif" text-anchor="middle" letter-spacing="0.8">
          ${secondaryText}
        </text>
      </g>
    </svg>
  `;
  
  // Clean string and encode to base64
  const trimmedSvg = svgString.trim();
  const utf8Bytes = new TextEncoder().encode(trimmedSvg);
  const base64 = btoa(String.fromCharCode(...utf8Bytes));
  return `data:image/svg+xml;base64,${base64}`;
}

export default function Logo({ size = 'md', showText = true, theme = 'light', className = '' }: LogoProps) {
  const [logoText1, setLogoText1] = React.useState('JV TECH');
  const [logoText2, setLogoText2] = React.useState('Test & Training Center');
  const [logoLocation, setLogoLocation] = React.useState('Kushinagar');
  const [logoImage, setLogoImage] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('JV_TECH_CRM_SYSTEM_SETTINGS');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.logoTextPrimary) setLogoText1(parsed.logoTextPrimary);
          if (parsed.logoTextSecondary) setLogoText2(parsed.logoTextSecondary);
          if (parsed.logoTextLocation) setLogoLocation(parsed.logoTextLocation);
          if (parsed.logoImageUrl) {
            setLogoImage(parsed.logoImageUrl);
            setImageError(false);
          } else {
            setLogoImage(null);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadSettings();
    // Listen for custom events to update settings immediately
    window.addEventListener('crm-settings-updated', loadSettings);
    return () => {
      window.removeEventListener('crm-settings-updated', loadSettings);
    };
  }, []);

  // Determine dimensions based on size
  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-28 h-28',
    lg: 'w-48 h-48',
    custom: 'w-full h-full'
  };

  const svgDataUrl = getLogoSvgDataUrl(logoText1, logoText2);

  return (
    <div className={`flex items-center gap-3 ${className}`} id="jv-tech-branding-logo">
      {/* Brand logo rendered as robust inline SVG JSX */}
      <div className={`${iconSizes[size]} relative shrink-0 select-none flex items-center justify-center`}>
        {logoImage && !imageError ? (
          <img 
            src={logoImage} 
            alt="JV TECH Logo" 
            className="w-full h-full object-contain rounded-xl drop-shadow-md"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md animate-fade-in"
          >
            <defs>
              <filter id="white-outline" x="-25%" y="-25%" width="150%" height="150%">
                <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="8" />
                <feFlood floodColor="white" floodOpacity="1" result="WHITE" />
                <feComposite in="WHITE" in2="DILATED" operator="in" result="OUTLINE" />
                <feMerge>
                  <feMergeNode in="OUTLINE" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g filter="url(#white-outline)">
              {/* 1. Gear Background (Silver-Grey and bold 16 teeth teeth to match reference image) */}
              <g id="gear-background">
                {/* Thick 3D gear teeth blocks rotated around center (200, 180) */}
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(0 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(22.5 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(45 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(67.5 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(90 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(112.5 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(135 200 180)" />
                <rect x="182" y="16" width="36" height="328" rx="4" fill="#a1a1aa" stroke="#141517" strokeWidth="6.5" transform="rotate(157.5 200 180)" />
                
                {/* Gear central solid hub body */}
                <circle cx="200" cy="180" r="132" fill="#a1a1aa" stroke="#141517" strokeWidth="7" />
                {/* Inner dark rim */}
                <circle cx="200" cy="180" r="115" fill="#141517" />
              </g>

              {/* 2. Intense Red Circle Shield Accent */}
              <circle cx="200" cy="180" r="102" fill="#e31b23" stroke="#141517" strokeWidth="6" />

              {/* 3. Welder Mascot Character */}
              <g id="welder-mascot">
                {/* White Collar / Shirt underneath */}
                <path d="M165 190 L185 205 L192 195 Z" fill="#ffffff" stroke="#141517" strokeWidth="5.5" strokeLinejoin="round" />
                <path d="M235 190 L215 205 L208 195 Z" fill="#ffffff" stroke="#141517" strokeWidth="5.5" strokeLinejoin="round" />

                {/* Red Apron and Shoulders */}
                <path d="M142 205 C142 180, 258 180, 258 205 L278 280 L122 280 Z" fill="#e31b23" stroke="#141517" strokeWidth="6.5" strokeLinejoin="round" />
                
                {/* Apron straps */}
                <path d="M158 200 L172 235 L162 238 L148 200 Z" fill="#141517" />
                <path d="M242 200 L228 235 L238 238 L252 200 Z" fill="#141517" />
                
                {/* Buckle rivet details */}
                <circle cx="166" cy="220" r="4" fill="#fbbf24" stroke="#141517" strokeWidth="1" />
                <circle cx="234" cy="220" r="4" fill="#fbbf24" stroke="#141517" strokeWidth="1" />

                {/* Welder Helmet Shield */}
                <path d="M158 112 C158 72, 168 55, 200 55 C232 55, 242 72, 242 112 C242 145, 237 165, 200 165 C163 165, 158 145, 158 112 Z" fill="#1e1f22" stroke="#a1a1aa" strokeWidth="6.5" />
                
                {/* Helmet top crown ridge */}
                <path d="M188 55 C188 40, 212 40, 212 55 L206 82 L194 82 Z" fill="#475569" stroke="#141517" strokeWidth="4.5" />

                {/* Visor window outer metallic frame */}
                <rect x="172" y="86" width="56" height="26" rx="4" fill="#334155" stroke="#141517" strokeWidth="5.5" />
                {/* Visor glowing glass to match the grey/white metallic reflection exactly */}
                <rect x="176" y="90" width="48" height="18" rx="2" fill="#e2e8f0" />
                {/* White sheen shine reflections */}
                <rect x="178" y="92" width="44" height="14" rx="1" fill="#f8fafc" />
                <rect x="180" y="93" width="40" height="5" fill="#ffffff" opacity={0.9} />

                {/* Side Pivot Knobs */}
                <rect x="151" y="105" width="8" height="16" rx="2" fill="#a1a1aa" stroke="#141517" strokeWidth="3.5" />
                <rect x="241" y="105" width="8" height="16" rx="2" fill="#a1a1aa" stroke="#141517" strokeWidth="3.5" />

                {/* Glove and Torch */}
                {/* Torch shaft handle */}
                <path d="M110 195 L145 255" stroke="#141517" strokeWidth={13} strokeLinecap="round" />
                {/* Golden Brass nozzle */}
                <path d="M85 185 L110 188 L122 212" fill="none" stroke="#d97706" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M75 185 L85 185" stroke="#94a3b8" strokeWidth={15} strokeLinecap="round" />

                {/* Sparks */}
                <g id="sparks">
                  <path d="M70 185 L52 180 M70 185 L56 198 M70 185 L58 170" stroke="#fbbf24" strokeWidth={4.5} strokeLinecap="round" />
                  <path d="M70 185 L48 188 M70 185 L60 205" stroke="#fbbf24" strokeWidth={3} strokeLinecap="round" />
                  <circle cx="70" cy="185" r="5.5" fill="#ffffff" />
                </g>

                {/* Grey Glove holding handle */}
                <path d="M112 212 C102 212, 108 242, 128 242 C138 242, 142 222, 132 212 Z" fill="#4b5563" stroke="#141517" strokeWidth="5.5" />
                <circle cx="118" cy="218" r="5" fill="#9ca3af" stroke="#141517" strokeWidth="2.5" />
                <circle cx="121" cy="227" r="5" fill="#9ca3af" stroke="#141517" strokeWidth="2.5" />
                <circle cx="124" cy="236" r="5" fill="#9ca3af" stroke="#141517" strokeWidth="2.5" />
              </g>

              {/* 4. Bottom Banner Plate with Curved notched ends */}
              <path d="M 65 265 L 335 265 Q 350 265, 350 280 C 340 295, 340 315, 350 330 Q 350 345, 335 345 L 65 345 Q 50 345, 50 330 C 60 315, 60 295, 50 280 Q 50 265, 65 265 Z" fill="#ffffff" stroke="#141517" strokeWidth={12} strokeLinejoin="round" />
              <path d="M 65 265 L 335 265 Q 350 265, 350 280 C 340 295, 340 315, 350 330 Q 350 345, 335 345 L 65 345 Q 50 345, 50 330 C 60 315, 60 295, 50 280 Q 50 265, 65 265 Z" fill="#ffffff" stroke="#a1a1aa" strokeWidth={6} strokeLinejoin="round" />

              <circle cx="72" cy="280" r="5.5" fill="#141517" />
              <circle cx="328" cy="280" r="5.5" fill="#141517" />
              <circle cx="72" cy="330" r="5.5" fill="#141517" />
              <circle cx="328" cy="330" r="5.5" fill="#141517" />

              {/* 3D Black shadow text offset slightly to match red collegiate-slab drop shadow perfectly */}
              <text x="203" y="311" fill="#141517" fontSize="44" fontWeight="900" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="2">
                {logoText1.toUpperCase()}
              </text>
              <text x="200" y="308" fill="#e31b23" fontSize="44" fontWeight="900" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="2">
                {logoText1.toUpperCase()}
              </text>

              <line x1="88" y1="316" x2="312" y2="316" stroke="#141517" strokeWidth="2.5" />

              {/* Subtext: TEST & TRAINING CENTER */}
              <text x="200" y="335" fill="#141517" fontSize="14.5" fontWeight="900" fontFamily="'Inter', 'Helvetica', sans-serif" textAnchor="middle" letterSpacing="0.8">
                {logoText2.toUpperCase()}
              </text>
            </g>
          </svg>
        )}
      </div>

      {/* Brand Text Section (Side-by-side) */}
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`font-black tracking-tight text-red-600 font-display uppercase leading-none
              ${size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-3xl'}`}
          >
            {logoText1}
          </span>
          <span 
            className={`font-bold font-sans tracking-widest uppercase leading-none mt-1
              ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}
              ${size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-xs'}`}
          >
            {logoText2}
          </span>
          <span 
            className={`font-semibold font-sans tracking-wider uppercase leading-none mt-0.5
              ${theme === 'dark' ? 'text-brand-400' : 'text-brand-500'}
              ${size === 'sm' ? 'text-[7px]' : size === 'md' ? 'text-[8px]' : 'text-[9px]'}`}
          >
            {logoLocation}
          </span>
        </div>
      )}
    </div>
  );
}