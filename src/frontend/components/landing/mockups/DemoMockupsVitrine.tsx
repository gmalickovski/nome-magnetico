import { useEffect, useState } from 'react';
import { ChatScene } from './ChatScene.js';
import { DeviceFrame } from './DeviceFrame.js';
import { PathChooserScene } from './PathChooserScene.js';
import type { MockupDevice, MockupTheme } from './types.js';

const REDUCED_MOTION_EVENT = 'nm-demo-mockups-reduced-motion';

function useQaReducedMotionOverride(): boolean {
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent<{ forced?: boolean }>).detail;
      setForced(Boolean(detail?.forced));
    };
    window.addEventListener(REDUCED_MOTION_EVENT, onToggle);
    return () => window.removeEventListener(REDUCED_MOTION_EVENT, onToggle);
  }, []);

  return forced;
}

export function DemoMockupsControls() {
  const [forced, setForced] = useState(false);

  const toggle = () => {
    const next = !forced;
    setForced(next);
    window.dispatchEvent(new CustomEvent(REDUCED_MOTION_EVENT, { detail: { forced: next } }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={forced}
        data-qa-reduced-motion-toggle
        className={`rounded-full px-4 py-2 text-xs font-inter font-medium transition-all duration-200 ${
          forced
            ? 'bg-[#D4AF37] text-[#111111] font-semibold'
            : 'bg-[#1C1C1C] text-[#e5e2e1] ring-1 ring-white/15 hover:ring-[#D4AF37]/50'
        }`}
      >
        {forced ? 'Reduced motion: simulado (ativo)' : 'Simular reduced-motion'}
      </button>

      <a
        href="#bloco-deviceframe"
        className="rounded-full bg-[#1C1C1C] px-3.5 py-2 text-xs font-inter text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors"
      >
        DeviceFrame
      </a>
      <a
        href="#bloco-pathchooser"
        className="rounded-full bg-[#1C1C1C] px-3.5 py-2 text-xs font-inter text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors"
      >
        PathChooserScene
      </a>
      <a
        href="#bloco-chatscene"
        className="rounded-full bg-[#1C1C1C] px-3.5 py-2 text-xs font-inter text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors"
      >
        ChatScene (3 caminhos)
      </a>
    </div>
  );
}

export function DemoDeviceFrameShowcase() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
        <div className="rounded-2xl bg-[#181818] p-5 sm:p-6">
          <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#f2ca50] mb-4">
            variant=&quot;phone&quot; · 390×844
          </div>
          <DeviceFrame
            variant="phone"
            theme="social"
            srSummary="Exemplo de moldura de celular exibindo um cartão da análise."
          >
            <div className="flex-1 flex flex-col justify-center items-center text-center p-5 gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#F2CA50] to-[#bea5ff]" />
              <h3 className="font-cinzel text-sm font-bold text-[#e5e2e1]">
                Moldura Celular
              </h3>
              <p className="font-inter text-xs text-[#a0a0a0] leading-relaxed">
                Proporção 390×844 com cantos suaves, notch e sombra ambiental.
              </p>
            </div>
          </DeviceFrame>
        </div>

        <div className="rounded-2xl bg-[#181818] p-5 sm:p-6 min-w-0">
          <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#f2ca50] mb-4">
            variant=&quot;desktop&quot; · barra e URL nomemagnetico.com.br
          </div>
          <DeviceFrame
            variant="desktop"
            theme="artistico"
            srSummary="Exemplo de moldura desktop com URL nomemagnetico.com.br."
          >
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 gap-3">
              <span className="rounded-full bg-[#1C1C1C] px-3 py-1 text-[11px] font-inter text-[#bea5ff]">
                Desktop Browser Shell
              </span>
              <h3 className="font-cinzel text-lg font-bold text-[#e5e2e1]">
                Janela Desktop · Tema Palco
              </h3>
              <p className="font-inter text-sm text-[#a0a0a0] max-w-md leading-relaxed">
                Barra superior com 3 pontos, pílula de endereço e superfície escura do design system.
              </p>
            </div>
          </DeviceFrame>
        </div>
      </div>

      <div className="rounded-2xl bg-[#181818] p-5 sm:p-8 min-w-0">
        <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#f2ca50] mb-4">
          variant=&quot;both&quot; · abaixo de 768 px exibe só o celular
        </div>
        <DeviceFrame
          variant="both"
          theme="bebe"
          srSummary="Exemplo combinado de desktop ao fundo e celular deslocado à frente, tema bebê."
          desktopContent={
            <div className="flex-1 flex flex-col justify-center p-8 gap-3">
              <span className="self-start rounded-full bg-[#1C1C1C] px-3 py-1 text-[11px] font-inter text-[#F5C6CE]">
                Desktop + Celular (Tema Bebê)
              </span>
              <h3 className="font-cinzel text-xl font-bold text-[#e5e2e1]">
                Composição Combinada
              </h3>
              <p className="font-inter text-sm text-[#a0a0a0] max-w-md leading-relaxed">
                Em telas a partir de 768 px, o desktop aparece atrás e o celular fica à frente. No
                celular, apenas a moldura móvel é exibida.
              </p>
            </div>
          }
          phoneContent={
            <div className="flex-1 flex flex-col justify-center items-center text-center p-5 gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5C6CE] via-[#D8CCF7] to-[#BCE3D7]" />
              <h4 className="font-cinzel text-sm font-bold text-[#e5e2e1]">Versão Mobile</h4>
              <p className="font-inter text-xs text-[#a0a0a0] leading-relaxed">
                Foco exclusivo na tela do celular abaixo de 768 px.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}

export function DemoPathChooserShowcase() {
  const forcedReducedMotion = useQaReducedMotionOverride();

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        <div className="rounded-2xl bg-[#181818] p-5 sm:p-6 min-w-0">
          <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#d7c6ff] mb-2">
            PathChooserScene · phone
          </div>
          <PathChooserScene
            device="phone"
            theme="social"
            forceReducedMotion={forcedReducedMotion}
            showStatusPill
          />
        </div>

        <div className="rounded-2xl bg-[#181818] p-5 sm:p-6 min-w-0">
          <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#d7c6ff] mb-2">
            PathChooserScene · desktop
          </div>
          <PathChooserScene
            device="desktop"
            theme="artistico"
            forceReducedMotion={forcedReducedMotion}
            showStatusPill
          />
        </div>
      </div>

      <div className="rounded-2xl bg-[#181818] p-5 sm:p-8 min-w-0">
        <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#d7c6ff] mb-2">
          PathChooserScene · both (alternando os 3 caminhos a cada ciclo)
        </div>
        <PathChooserScene
          device="both"
          theme="bebe"
          forceReducedMotion={forcedReducedMotion}
          showStatusPill
        />
      </div>
    </div>
  );
}

const CHAT_THEMES: ReadonlyArray<{ theme: MockupTheme; label: string; subtitle: string }> = [
  {
    theme: 'social',
    label: 'Caminho 1 · Harmonizar o meu nome',
    subtitle: 'Tema dourado Celestial Alchemist · foco e preferências de assinatura.',
  },
  {
    theme: 'artistico',
    label: 'Caminho 2 · Criar um nome artístico',
    subtitle: 'Tema palco (dourado + roxo) · área artística, imagem e nomes próximos/novos.',
  },
  {
    theme: 'bebe',
    label: 'Caminho 3 · Escolher o nome do meu bebê',
    subtitle: 'Acentos pastel dentro do mockup · situação, sexo e estilo preferido.',
  },
];

const CHAT_DEVICES: ReadonlyArray<{ device: MockupDevice; label: string }> = [
  { device: 'both', label: 'both (desktop + phone)' },
  { device: 'phone', label: 'phone (390×844)' },
  { device: 'desktop', label: 'desktop' },
];

export function DemoChatScenesShowcase() {
  const forcedReducedMotion = useQaReducedMotionOverride();
  const [selectedDevice, setSelectedDevice] = useState<MockupDevice>('both');

  return (
    <div className="space-y-12">
      {/* Seletor rápido de modo + blocos completos abaixo com os 3 modos visíveis */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#181818] p-4 sm:p-5">
        <div>
          <h3 className="font-cinzel text-sm font-bold text-[#e5e2e1]">
            Modo dos 3 caminhos abaixo
          </h3>
          <p className="font-inter text-xs text-[#a0a0a0] mt-0.5">
            Alterne para comparar todos os roteiros em `both`, `phone` ou `desktop` (ou role para
            ver os 3 modos simultâneos logo em seguida).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CHAT_DEVICES.map((opt) => {
            const active = selectedDevice === opt.device;
            return (
              <button
                key={opt.device}
                type="button"
                onClick={() => setSelectedDevice(opt.device)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-1.5 text-xs font-inter transition-all duration-200 ${
                  active
                    ? 'bg-[#D4AF37] text-[#111111] font-semibold'
                    : 'bg-[#131313] text-[#e5e2e1]/85 ring-1 ring-white/10 hover:ring-[#D4AF37]/45'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Os 3 caminhos no modo selecionado (padrão `both`) */}
      <div className="space-y-10">
        {CHAT_THEMES.map((item) => (
          <div key={item.theme} className="rounded-2xl bg-[#181818] p-5 sm:p-8 min-w-0">
            <div className="mb-4">
              <div className="font-cinzel text-base sm:text-lg font-bold text-[#e5e2e1]">
                {item.label}
              </div>
              <p className="font-inter text-xs sm:text-sm text-[#a0a0a0] mt-1">{item.subtitle}</p>
            </div>
            <ChatScene
              device={selectedDevice}
              theme={item.theme}
              forceReducedMotion={forcedReducedMotion}
              showStatusPill
            />
          </div>
        ))}
      </div>

      {/* Grade explícita com os 3 modos visíveis sem clicar (phone + desktop) */}
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#f2ca50]">
            Comparativo direto · phone e desktop isolados
          </span>
          <h3 className="font-cinzel text-lg font-bold text-[#e5e2e1] mt-1">
            Modos individuais de ChatScene em tela simultânea
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
          <div className="rounded-2xl bg-[#181818] p-5 sm:p-6 min-w-0">
            <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#f2ca50] mb-2">
              ChatScene · phone (social)
            </div>
            <ChatScene
              device="phone"
              theme="social"
              forceReducedMotion={forcedReducedMotion}
              showStatusPill
            />
          </div>

          <div className="rounded-2xl bg-[#181818] p-5 sm:p-6 min-w-0">
            <div className="text-[11px] font-inter uppercase tracking-[0.1em] text-[#bea5ff] mb-2">
              ChatScene · desktop (artístico)
            </div>
            <ChatScene
              device="desktop"
              theme="artistico"
              forceReducedMotion={forcedReducedMotion}
              showStatusPill
            />
          </div>
        </div>
      </div>
    </div>
  );
}
