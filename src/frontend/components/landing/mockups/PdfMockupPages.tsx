import type { MockupTheme } from './types.js';

interface PdfPageRenderProps {
  theme: MockupTheme;
  pageNumber: 1 | 2 | 3 | 4;
}

/** Miniaturas fiéis das páginas de `docs/architecture/pdf-layout-base/` para o `PdfFlipScene`. */
export function PdfMockupPageSheet({ theme, pageNumber }: PdfPageRenderProps) {
  if (theme === 'social') {
    if (pageNumber === 1) {
      return (
        <div className="w-full h-full bg-[#131313] text-[#e5e2e1] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.16em]">
            <span className="font-cinzel font-bold text-[#f2ca50]">NOME MAGNÉTICO</span>
            <span className="text-[#bfb9ae]">Relatório completo</span>
          </div>

          <div className="flex flex-col items-center text-center gap-2.5 my-auto">
            <svg width="78" height="78" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#d4af37" strokeOpacity="0.35" strokeWidth="2" />
              <polygon
                points="100,14 120,74 184,74 132,112 152,174 100,136 48,174 68,112 16,74 80,74"
                fill="#d4af37"
                fillOpacity="0.16"
                stroke="#f2ca50"
                strokeWidth="3"
              />
              <polygon
                points="100,52 110,84 144,84 116,104 127,138 100,118 73,138 84,104 56,84 90,84"
                fill="#bea5ff"
                fillOpacity="0.2"
                stroke="#d7c6ff"
                strokeWidth="2"
              />
            </svg>
            <div className="text-[7px] uppercase tracking-[0.22em] text-[#d7c6ff]">
              Harmonização do Nome Social
            </div>
            <div className="font-cinzel font-bold text-xl tracking-[0.06em] text-[#f2ca50]">
              Marina Côsta
            </div>
            <div className="text-[9px] text-[#bfb9ae]">Nascimento: Marina Pereira</div>
          </div>

          <div className="flex items-center justify-between text-[7px] text-[#9c968b]">
            <span>Numerologia Cabalística</span>
            <span>nomemagnetico.com.br</span>
          </div>
        </div>
      );
    }

    if (pageNumber === 2) {
      return (
        <div className="w-full h-full bg-[#FBF9F4] text-[#2A2620] p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[7px] text-[#6E6658]">
            <span className="font-cinzel font-bold tracking-[0.14em] text-[#8A6A12]">
              NOME MAGNÉTICO
            </span>
            <span>Marina Côsta · Resumo</span>
          </div>
          <div>
            <div className="text-[7px] uppercase tracking-[0.12em] font-semibold text-[#6B5A2E]">
              Seu relatório em 1 página
            </div>
            <div className="font-cinzel font-bold text-base text-[#8A6A12]">Marina Côsta</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <div className="text-[6.5px] uppercase text-[#6E6658]">Nota</div>
              <div className="font-cinzel font-bold text-xs">
                <span className="text-[#CA8A04]">58</span> →{' '}
                <span className="text-[#047857]">93</span>
              </div>
            </div>
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <div className="text-[6.5px] uppercase text-[#6E6658]">Bloqueios</div>
              <div className="font-cinzel font-bold text-xs text-[#2A2620]">2 → 0</div>
            </div>
            <div className="rounded-lg bg-[#EDE6FF] p-2">
              <div className="text-[6.5px] uppercase text-[#4B2E9E]">Vínculo</div>
              <div className="text-[8px] font-semibold text-[#4B2E9E] leading-tight">
                Harmônica
              </div>
            </div>
          </div>
          <div className="space-y-1 mt-0.5">
            {[
              ['Expressão', '4', '6'],
              ['Motivação', '2', '2'],
              ['Impressão', '2', '4'],
              ['Missão', '7', '3'],
              ['Destino', '6', '6'],
            ].map(([n, a, d]) => (
              <div
                key={n}
                className="grid grid-cols-[1fr_20px_14px_20px] items-center rounded bg-white px-2 py-1 text-[8px]"
              >
                <span className="font-semibold text-[#2A2620]">{n}</span>
                <span className="font-cinzel font-bold text-center text-[#6E6658]">{a}</span>
                <span className="text-center text-[#6E6658]">→</span>
                <span className="font-cinzel font-bold text-center text-[#8A6A12]">{d}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex justify-between text-[7px] text-[#6E6658]">
            <span>Parte 1 · Resumo</span>
            <span>Página 2</span>
          </div>
        </div>
      );
    }

    if (pageNumber === 3) {
      return (
        <div className="w-full h-full bg-[#FBF9F4] text-[#2A2620] p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[7px] text-[#6E6658]">
            <span className="font-cinzel font-bold tracking-[0.14em] text-[#8A6A12]">
              NOME MAGNÉTICO
            </span>
            <span>Parte 1 · Essência</span>
          </div>
          <span className="self-start rounded-full bg-[#2A2620] px-2.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.14em] text-[#F3E7C4]">
            Parte 1 · Você hoje
          </span>
          <div className="font-cinzel font-bold text-base text-[#8A6A12]">A Essência</div>
          <div className="rounded-xl bg-[#F4F0E6] p-2.5 flex items-center gap-2.5">
            <svg width="56" height="56" viewBox="0 0 300 290" aria-hidden="true">
              <polygon
                points="150,30 179,118 271,118 197,172 225,260 150,206 75,260 103,172 29,118 121,118"
                fill="#10B981"
                fillOpacity="0.16"
                stroke="#10B981"
                strokeWidth="8"
              />
            </svg>
            <div className="min-w-0 space-y-1">
              <div className="text-[7px] font-semibold uppercase text-[#6B5A2E]">
                Estrela do Nome
              </div>
              <span className="inline-block rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[7.5px] font-semibold text-[#047857]">
                Nota 93 · Harmonioso
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['6', 'Destino'],
              ['6', 'Expressão'],
              ['2', 'Motivação'],
              ['4', 'Impressão'],
            ].map(([val, name]) => (
              <div key={name} className="rounded-lg bg-white p-2 flex items-center gap-2 shadow-sm">
                <span className="font-cinzel font-bold text-sm text-[#8A6A12]">{val}</span>
                <span className="text-[8px] font-semibold text-[#2A2620]">{name}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex justify-between text-[7px] text-[#6E6658]">
            <span>Estrela comparativa</span>
            <span>Página 6</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#FBF9F4] text-[#2A2620] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[7px] text-[#6E6658]">
          <span className="font-cinzel font-bold tracking-[0.14em] text-[#8A6A12]">
            NOME MAGNÉTICO
          </span>
          <span>Triângulo da Vida</span>
        </div>
        <div className="font-cinzel font-bold text-sm text-[#2A2620]">
          Marina Pereira · Antes
        </div>
        <div className="rounded-xl bg-white p-2.5 flex flex-col items-center gap-1 shadow-sm">
          <div className="flex gap-1 text-[7px] font-bold text-[#6B5A2E]">
            {'MARINA'.split('').map((l, idx) => (
              <span key={idx} className="w-3.5 text-center">
                {l}
              </span>
            ))}
          </div>
          {[
            [4, 1, 2, 1, 5, 1],
            [5, 3, 2, 2, 2],
            [8, 5, 4, 4],
            [4, 9, 8],
            [4, 8],
            [5],
          ].map((row, r) => (
            <div key={r} className="flex gap-1">
              {row.map((num, c) => {
                const isBloq = r === 1 && c >= 2 && c <= 4;
                const isApex = r === 5;
                return (
                  <span
                    key={c}
                    className={`w-3.5 h-3.5 rounded text-[7px] flex items-center justify-center font-bold ${
                      isBloq
                        ? 'bg-[#B3261E] text-white'
                        : isApex
                          ? 'bg-[#EDE6FF] text-[#4B2E9E] ring-1 ring-[#6D4FC2]'
                          : 'bg-[#F4F0E6] text-[#3D372D]'
                    }`}
                  >
                    {num}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-[#FBE9E7] p-2">
            <div className="text-[6.5px] uppercase text-[#9B1C14]">Bloqueio</div>
            <div className="text-[9px] font-bold text-[#9B1C14]">222 em vermelho</div>
          </div>
          <div className="rounded-lg bg-[#EDE6FF] p-2">
            <div className="text-[6.5px] uppercase text-[#4B2E9E]">Arcano Regente</div>
            <div className="text-[9px] font-bold text-[#4B2E9E]">5 · O Hierofante</div>
          </div>
        </div>
        <div className="mt-auto flex justify-between text-[7px] text-[#6E6658]">
          <span>Triângulo da Vida completo</span>
          <span>Página 12</span>
        </div>
      </div>
    );
  }

  if (theme === 'artistico') {
    if (pageNumber === 1) {
      return (
        <div className="relative overflow-hidden w-full h-full bg-[#0E0D10] text-[#e5e2e1] p-5 flex flex-col justify-between">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(242,202,80,0.22) 0%, rgba(190,165,255,0.12) 38%, rgba(14,13,16,0) 70%)',
            }}
          />
          <div className="relative flex items-center justify-between text-[8px] uppercase tracking-[0.16em]">
            <span className="font-cinzel font-bold text-[#f2ca50]">NOME MAGNÉTICO</span>
            <span className="text-[#bfb9ae]">Nome artístico</span>
          </div>
          <div className="relative flex flex-col items-center text-center gap-2 my-auto">
            <div className="text-[7px] uppercase tracking-[0.26em] text-[#d7c6ff]">
              Apresentando
            </div>
            <div className="font-cinzel font-bold text-2xl tracking-[0.08em] text-[#f2ca50]">
              LUNA VALE
            </div>
            <div className="w-12 h-[1.5px] bg-[#d4af37]/60" />
            <div className="text-[8.5px] text-[#d6d1c8]">Cantora · Marcante · Palco</div>
            <div className="text-[7.5px] text-[#9c968b]">Nome civil: Larissa Macedo</div>
          </div>
          <div className="relative flex justify-between text-[7px] text-[#9c968b]">
            <span>Contratos seguem o nome civil</span>
            <span>nomemagnetico.com.br</span>
          </div>
        </div>
      );
    }

    if (pageNumber === 2) {
      return (
        <div className="w-full h-full bg-[#FBF9F4] text-[#2A2620] p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[7px] text-[#6E6658]">
            <span className="font-cinzel font-bold tracking-[0.14em] text-[#8A6A12]">
              NOME MAGNÉTICO
            </span>
            <span>Luna Vale · Resumo</span>
          </div>
          <div>
            <div className="text-[7px] uppercase tracking-[0.12em] font-semibold text-[#6B5A2E]">
              Seu nome artístico em 1 página
            </div>
            <div className="font-cinzel font-bold text-base text-[#8A6A12]">Luna Vale</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-white p-2">
              <div className="text-[6.5px] uppercase text-[#6E6658]">Nota</div>
              <div className="font-cinzel font-bold text-sm text-[#047857]">94</div>
            </div>
            <div className="rounded-lg bg-[#EDE6FF] p-2">
              <div className="text-[6.5px] uppercase text-[#4B2E9E]">Afinidade</div>
              <div className="text-[9px] font-bold text-[#2E1B6B]">Alta</div>
            </div>
            <div className="rounded-lg bg-[#F4F0E6] p-2">
              <div className="text-[6.5px] uppercase text-[#6B5A2E]">Tipo</div>
              <div className="text-[8px] font-semibold text-[#2A2620]">Novo</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            <div className="rounded-lg bg-white p-2">
              <div className="text-[6.5px] uppercase font-bold text-[#6B5A2E]">
                Próximas do seu
              </div>
              <div className="text-[8px] text-[#3D372D] mt-0.5">Lúna Ribeiro · Lari M.</div>
            </div>
            <div className="rounded-lg bg-white p-2">
              <div className="text-[6.5px] uppercase font-bold text-[#6B5A2E]">
                Totalmente novas
              </div>
              <div className="text-[8px] text-[#3D372D] mt-0.5">Luna Vale · Véra Solis</div>
            </div>
          </div>
          <div className="mt-auto flex justify-between text-[7px] text-[#6E6658]">
            <span>Expressão 3 combina com palco</span>
            <span>Página 2</span>
          </div>
        </div>
      );
    }

    if (pageNumber === 3) {
      return (
        <div className="w-full h-full bg-[#FBF9F4] text-[#2A2620] p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[7px] text-[#6E6658]">
            <span className="font-cinzel font-bold tracking-[0.14em] text-[#8A6A12]">
              NOME MAGNÉTICO
            </span>
            <span>Luna Vale · Parte 1</span>
          </div>
          <span className="self-start rounded-full bg-[#2A2620] px-2.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-[#F3E7C4]">
            Parte 1 · Você e sua área
          </span>
          <div className="font-cinzel font-bold text-sm text-[#8A6A12]">Seu perfil artístico</div>
          <div className="grid grid-cols-4 gap-1">
            {[
              ['Área', 'Cantora'],
              ['Estilo', 'Palco'],
              ['Imagem', 'Marcante'],
              ['Tipo', 'Novo'],
            ].map(([k, v]) => (
              <div key={k} className="rounded bg-white p-1.5">
                <div className="text-[6px] uppercase text-[#6B5A2E]">{k}</div>
                <div className="text-[8px] font-bold text-[#2A2620] truncate">{v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[#EDE6FF] p-2.5 space-y-1">
            <div className="text-[8.5px] font-bold text-[#2E1B6B]">
              Expressão 3 · comunicação e criatividade
            </div>
            <div className="text-[7.5px] text-[#3D372D] leading-snug">
              Vibração de carisma e conexão com o público para quem canta.
            </div>
          </div>
          <div className="mt-auto flex justify-between text-[7px] text-[#6E6658]">
            <span>Afinidade número × área</span>
            <span>Página 4</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#FBF9F4] text-[#2A2620] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[7px] text-[#6E6658]">
          <span className="font-cinzel font-bold tracking-[0.14em] text-[#8A6A12]">
            NOME MAGNÉTICO
          </span>
          <span>Luna Vale · Parte 3</span>
        </div>
        <span className="self-start rounded-full bg-[#2A2620] px-2.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-[#F3E7C4]">
          Parte 3 · No palco
        </span>
        <div className="font-cinzel font-bold text-sm text-[#8A6A12]">
          Como usar seu nome artístico
        </div>
        <div className="rounded-xl bg-white p-3 space-y-2 shadow-sm">
          <div className="font-cinzel text-base text-[#8A6A12]/70">Luna Vale</div>
          <div className="h-[1px] bg-[#E2DCCD]" />
          <div className="text-[7px] text-[#6E6658]">
            Mesma grafia em capas, autógrafos, cartazes e @ nas redes.
          </div>
        </div>
        <div className="rounded-xl bg-[#F4F0E6] p-2.5 space-y-1">
          <div className="text-[8px] font-bold text-[#2A2620]">
            Contratos e documentos (informativo)
          </div>
          <div className="text-[7px] text-[#3D372D] leading-snug">
            Documentos oficiais mantêm o nome civil; não substitui orientação jurídica.
          </div>
        </div>
        <div className="mt-auto flex justify-between text-[7px] text-[#6E6658]">
          <span>Guia de palco e marca pessoal</span>
          <span>Página 6</span>
        </div>
      </div>
    );
  }

  // Tema bebê (tons pastel fiéis a docs/architecture/pdf-layout-base/Bebe*.dc.html)
  if (pageNumber === 1) {
    return (
      <div className="relative overflow-hidden w-full h-full bg-[#FFF6F4] text-[#4A3A36] p-5 flex flex-col justify-between">
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#FCE3E7]" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-[#F3E9FB]" />
        <div className="relative flex items-center justify-between text-[7.5px] uppercase tracking-[0.14em]">
          <span className="font-cinzel font-bold text-[#9E4A5B]">NOME MAGNÉTICO</span>
          <span className="text-[#8C6B70]">Manual para os pais</span>
        </div>
        <div className="relative flex flex-col items-center text-center gap-2 my-auto">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            <span className="text-xl text-[#D98A99]" aria-hidden="true">
              ♥
            </span>
          </div>
          <div className="text-[7px] uppercase tracking-[0.2em] text-[#9E4A5B]">O nome de</div>
          <div className="font-cinzel text-xl text-[#4A3A36]">Sofia Lima</div>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[7px] text-[#9E4A5B] shadow-sm">
            Janela prevista · dias possíveis do parto
          </span>
        </div>
        <div className="relative flex justify-between text-[7px] text-[#7A6A65]">
          <span>Tendências e qualidades</span>
          <span>nomemagnetico.com.br</span>
        </div>
      </div>
    );
  }

  if (pageNumber === 2) {
    return (
      <div className="w-full h-full bg-[#FFF6F4] text-[#4A3A36] p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[7px] text-[#8C7B76]">
          <span className="font-cinzel font-bold tracking-[0.14em] text-[#9E4A5B]">
            NOME MAGNÉTICO
          </span>
          <span>Sofia · Carta aos pais</span>
        </div>
        <div className="font-cinzel text-sm text-[#9E4A5B]">Com carinho, para a família</div>
        <div className="rounded-xl bg-white p-3 space-y-1.5 shadow-sm">
          <div className="text-[7.5px] text-[#5C4B46] leading-snug">
            Escolher um nome é um dos primeiros gestos de cuidado. Este manual mostra as qualidades
            que Sofia Lima convida a florescer.
          </div>
          <div className="font-cinzel text-[8.5px] text-[#9E4A5B]">
            Com carinho, Nome Magnético
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {['1 · Quem chega', '2 · O nome', '3 · Entender', '4 · Crescer'].map((item) => (
            <div key={item} className="rounded-lg bg-[#FCE9EC] p-2 text-[7.5px] font-semibold text-[#9E4A5B]">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-auto flex justify-between text-[7px] text-[#8C7B76]">
          <span>Sem prazos fixos de cartório</span>
          <span>Página 2</span>
        </div>
      </div>
    );
  }

  if (pageNumber === 3) {
    return (
      <div className="w-full h-full bg-[#FFF6F4] text-[#4A3A36] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[7px] text-[#8C7B76]">
          <span className="font-cinzel font-bold tracking-[0.14em] text-[#9E4A5B]">
            NOME MAGNÉTICO
          </span>
          <span>Sofia · Parte 1</span>
        </div>
        <span className="self-start rounded-full bg-[#9E4A5B] px-2.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-white">
          Parte 1 · Quem está chegando
        </span>
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl bg-white p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FCE9EC] flex items-center justify-center font-cinzel text-sm text-[#9E4A5B]">
              6
            </div>
            <div>
              <div className="text-[7px] font-bold uppercase text-[#9E4A5B]">Destino 6</div>
              <div className="text-[7.5px] text-[#5C4B46]">Cuidado e harmonia</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#D1FAE5] px-2.5 py-2 text-[#047857]">
            <div className="text-[6.5px] uppercase">Dias bons</div>
            <div className="font-cinzel text-xs font-bold">26 de 29</div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-2.5 flex items-center gap-2.5">
          <svg width="46" height="46" viewBox="0 0 300 290" aria-hidden="true">
            <polygon
              points="150,30 179,118 271,118 197,172 225,260 150,206 75,260 103,172 29,118 121,118"
              fill="#10B981"
              fillOpacity="0.16"
              stroke="#10B981"
              strokeWidth="8"
            />
          </svg>
          <div>
            <span className="inline-block rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[7px] font-semibold text-[#047857]">
              Nota 95 · Harmonioso
            </span>
            <div className="text-[7px] text-[#8C7B76] mt-0.5">0 bloqueios no mapa</div>
          </div>
        </div>
        <div className="mt-auto flex justify-between text-[7px] text-[#8C7B76]">
          <span>Estrela dos 5 números</span>
          <span>Página 4</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#FFF6F4] text-[#4A3A36] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[7px] text-[#8C7B76]">
        <span className="font-cinzel font-bold tracking-[0.14em] text-[#9E4A5B]">
          NOME MAGNÉTICO
        </span>
        <span>Sofia · Parte 2</span>
      </div>
      <div className="font-cinzel text-sm text-[#9E4A5B]">O nome e os dias do parto</div>
      <div className="space-y-1">
        {[
          ['Sofia Lima', '95', true],
          ['Laura Lima', '91', true],
          ['Alice Lima', '61', false],
        ].map(([name, score, ok]) => (
          <div key={String(name)} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-[8px]">
            <span className="font-semibold">{name}</span>
            <span
              className={`rounded-full px-2 py-0.5 font-bold text-[7px] ${
                ok ? 'bg-[#D1FAE5] text-[#047857]' : 'bg-[#FEE2E2] text-[#B91C1C]'
              }`}
            >
              {score}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white p-2 space-y-1">
        <div className="text-[7px] font-semibold text-[#6B5A55]">Janela do parto (29 dias)</div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }, (_, idx) => {
            const isTarget = idx === 7;
            const isAttention = idx === 2 || idx === 11;
            return (
              <div
                key={idx}
                className={`h-3.5 rounded text-[6.5px] font-bold flex items-center justify-center ${
                  isTarget
                    ? 'bg-[#9E4A5B] text-white'
                    : isAttention
                      ? 'bg-[#F1ECEA] text-[#6B5A55]'
                      : 'bg-[#D1FAE5] text-[#047857]'
                }`}
              >
                {idx + 8}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-auto flex justify-between text-[7px] text-[#8C7B76]">
        <span>Comparativo dos candidatos</span>
        <span>Página 5</span>
      </div>
    </div>
  );
}
