import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import TriangleVisualization from './TriangleVisualization';
import KarmicDebts from './KarmicDebts';
import KarmicLessons from './KarmicLessons';
import HiddenTendencies from './HiddenTendencies';

const TABELA_CONVERSAO: Record<string, number> = {
  A: 1, I: 1, Q: 1, J: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4, X: 4,
  E: 5, H: 5, N: 5,
  U: 6, V: 6, W: 6, Ç: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

function calcularValorFront(letra: string): number {
  if (letra.toUpperCase() === 'Ç') return 6;
  const decomposto = letra.normalize('NFD');
  const base = decomposto.charAt(0).toUpperCase();
  let valor = TABELA_CONVERSAO[base] ?? 0;
  if (decomposto.length > 1) {
    const diacritico = decomposto.charAt(1);
    switch (diacritico) {
      case '\u0301': valor += 2; break; // agudo
      case '\u0303': valor += 3; break; // til
      case '\u0300': valor *= 2; break; // grave
      case '\u0308': valor *= 2; break; // trema
      case '\u0302': valor += 7; break; // circunflexo
    }
  }
  return valor;
}

function reduzirNumeroFront(n: number): number {
  let numero = Math.floor(n);
  while (numero > 9) {
    numero = String(numero).split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return numero;
}

function mapearFrequenciasFront(nome: string): Record<number, number> {
  const letras = nome.replace(/\s+/g, '').split('').filter(l => /\S/.test(l));
  const freq: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
  for (const letra of letras) {
    const v = calcularValorFront(letra);
    const r = reduzirNumeroFront(v);
    if (r >= 1 && r <= 8) {
      freq[r] = (freq[r] ?? 0) + 1;
    }
  }
  return freq;
}


const formatDateForApi = (dateStr: string) => {
  if (dateStr.length === 10 && dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
};

export default function AdminGeneralAnalysis() {
  const handleDateMask = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length >= 5) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };

  const [activeTab, setActiveTab] = useState<'social' | 'baby' | 'company'>('social');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isForceOpen, setIsForceOpen] = useState(false);
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; status: 'loading' | 'success' | 'error'; message: string }>({
    isOpen: false,
    status: 'loading',
    message: '',
  });
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (pdfModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [pdfModal.isOpen]);

  // Estados de Scroll para Animação do Container 2
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollCooldown = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;

    // Se o formulário estiver aberto como overlay (Editar clicado) e o usuário rolar a página, fecha o overlay.
    if (isForceOpen && Math.abs(currentScrollY - lastScrollY) > 5) {
      setIsForceOpen(false);
    }

    // Apenas ativa animação ao passar de 50px de scroll
    if (currentScrollY > 50) {
      if (!isScrollingDown) {
        setIsScrollingDown(true);
      }
    } else if (currentScrollY <= 10) {
      // Só volta ao tamanho normal se voltar praticamente ao topo da página
      if (isScrollingDown) {
        setIsScrollingDown(false);
      }
    }
    
    setLastScrollY(currentScrollY);
  };

  // Estados Comuns
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- ESTADOS: NOME SOCIAL ---
  const [socialName, setSocialName] = useState('');
  const [socialBirthDate, setSocialBirthDate] = useState('');
  const [socialCandidates, setSocialCandidates] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialResult, setSocialResult] = useState<any>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [selectedSocialCandidateIdx, setSelectedSocialCandidateIdx] = useState<number>(0);

  // --- ESTADOS: NOME DE BEBÊ ---
  const [babyCandidates, setBabyCandidates] = useState('');
  const [babyLastName, setBabyLastName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [babyGender, setBabyGender] = useState('surpresa');
  const [babyLoading, setBabyLoading] = useState(false);
  const [babyResult, setBabyResult] = useState<any>(null);
  const [babyError, setBabyError] = useState<string | null>(null);
  const [selectedBabyCandidateIdx, setSelectedBabyCandidateIdx] = useState<number>(0);

  // --- ESTADOS: NOME EMPRESARIAL ---
  const [companyCandidates, setCompanyCandidates] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerBirthDate, setPartnerBirthDate] = useState('');
  const [companyFoundDate, setCompanyFoundDate] = useState('');
  const [companyArea, setCompanyArea] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyResult, setCompanyResult] = useState<any>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [selectedCompanyCandidateIdx, setSelectedCompanyCandidateIdx] = useState<number>(0);


  // --- EFFECT DEBOUNCE: NOME SOCIAL ---
  useEffect(() => {
    if (activeTab !== 'social') return;
    if (socialName.length < 2) {
      setSocialResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSocialLoading(true);
      setSocialError(null);
      try {
        const candidates = socialCandidates
          .split(/[,;\n]+/)
          .map(c => c.trim())
          .filter(c => c.length >= 2);

        const res = await fetch('/api/admin/analyze-social-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_nascimento: socialName,
            data_nascimento: formatDateForApi(socialBirthDate),
            nomes_candidatos: candidates.length > 0 ? candidates : undefined,
          }),
        });

        if (!res.ok) {
          throw new Error('Erro na análise de cálculo do Nome Social');
        }

        const data = await res.json();
        setSocialResult(data);
        setSelectedSocialCandidateIdx(0); // Reset selection
      } catch (err: any) {
        setSocialError(err?.message || 'Falha ao processar análise');
        setSocialResult(null);
      } finally {
        setSocialLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [socialName, socialBirthDate, socialCandidates, activeTab]);

  // --- EFFECT DEBOUNCE: NOME DE BEBÊ ---
  useEffect(() => {
    if (activeTab !== 'baby') return;
    const candidates = babyCandidates
      .split(/[,;\n]+/)
      .map(c => c.trim())
      .filter(c => c.length >= 2);

    if (candidates.length === 0 || !babyLastName.trim()) {
      setBabyResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setBabyLoading(true);
      setBabyError(null);
      try {
        const res = await fetch('/api/admin/analyze-baby-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomes_candidatos: candidates,
            sobrenomes_disponiveis: [babyLastName.trim()],
            data_nascimento: babyBirthDate ? formatDateForApi(babyBirthDate) : '',
            genero_preferido: babyGender,
          }),
        });

        if (!res.ok) {
          throw new Error('Erro no cálculo de bebê em tempo real');
        }

        const data = await res.json();
        setBabyResult(data);
        setSelectedBabyCandidateIdx(0); // Reset selection
      } catch (err: any) {
        setBabyError(err?.message || 'Falha ao processar bebê');
        setBabyResult(null);
      } finally {
        setBabyLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [babyCandidates, babyLastName, babyBirthDate, babyGender, activeTab]);

  // --- EFFECT DEBOUNCE: NOME EMPRESARIAL ---
  useEffect(() => {
    if (activeTab !== 'company') return;
    const candidates = companyCandidates
      .split(/[,;\n]+/)
      .map(c => c.trim())
      .filter(c => c.length >= 2);

    if (candidates.length === 0 || !partnerName.trim()) {
      setCompanyResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCompanyLoading(true);
      setCompanyError(null);
      try {
        const payload: any = {
          nomes_candidatos: candidates,
          nome_socio_principal: partnerName.trim(),
          data_nascimento_socio: formatDateForApi(partnerBirthDate),
        };
        if (companyFoundDate) payload.data_fundacao = formatDateForApi(companyFoundDate);
        if (companyArea) payload.ramo_atividade = companyArea;
        if (companyDesc) payload.descricao_negocio = companyDesc;

        const res = await fetch('/api/admin/analyze-company-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error('Erro no cálculo empresarial em tempo real');
        }

        const data = await res.json();
        setCompanyResult(data);
        setSelectedCompanyCandidateIdx(0); // Reset selection
      } catch (err: any) {
        setCompanyError(err?.message || 'Falha ao processar empresa');
        setCompanyResult(null);
      } finally {
        setCompanyLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [companyCandidates, partnerName, partnerBirthDate, companyFoundDate, companyArea, companyDesc, activeTab]);

  // --- SALVAR RELATÓRIO DO ANALISTA ---
  const handleSaveAnalysis = async (isFree: boolean) => {
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    setPdfModal({
      isOpen: true,
      status: 'loading',
      message: 'Baixando análise...',
    });

    let productType: string;
    let nomeCompleto: string;
    let dataNascimento: string;
    let calculatedData: any;
    let extraParams: any = {};

    if (activeTab === 'social') {
      if (!socialResult) {
        setPdfModal({ isOpen: false, status: 'loading', message: '' });
        return;
      }
      productType = isFree ? 'analise_gratuita' : 'nome_social';
      nomeCompleto = socialName.trim();
      dataNascimento = formatDateForApi(socialBirthDate);
      calculatedData = socialResult;
      extraParams = {
        nomes_candidatos: socialCandidates.split(/[,;\n]+/).map(c => c.trim()).filter(c => c.length >= 2),
      };
    } else if (activeTab === 'baby') {
      if (!babyResult) {
        setPdfModal({ isOpen: false, status: 'loading', message: '' });
        return;
      }
      productType = 'nome_bebe';
      nomeCompleto = `(bebê) ${babyLastName.trim()}`;
      dataNascimento = formatDateForApi(babyBirthDate);
      calculatedData = babyResult;
      extraParams = {
        sobrenome_familia: babyLastName.trim(),
        nomes_candidatos: babyCandidates.split(/[,;\n]+/).map(c => c.trim()).filter(c => c.length >= 2),
        genero_preferido: babyGender,
      };
    } else {
      if (!companyResult) {
        setPdfModal({ isOpen: false, status: 'loading', message: '' });
        return;
      }
      productType = 'nome_empresa';
      nomeCompleto = `Sócio: ${partnerName.trim()}`;
      dataNascimento = formatDateForApi(partnerBirthDate);
      calculatedData = companyResult;
      extraParams = {
        nome_socio_principal: partnerName.trim(),
        data_nascimento_socio: formatDateForApi(partnerBirthDate),
        data_fundacao: companyFoundDate ? formatDateForApi(companyFoundDate) : null,
        ramo_atividade: companyArea || null,
        descricao_negocio: companyDesc || null,
        nomes_candidatos: companyCandidates.split(/[,;\n]+/).map(c => c.trim()).filter(c => c.length >= 2),
      };
    }

    try {
      const res = await fetch('/api/admin/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: productType,
          nome_completo: nomeCompleto,
          data_nascimento: dataNascimento,
          is_free: isFree,
          live_calculated_data: calculatedData,
          ...extraParams,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess('Análise salva com sucesso!');
        
        if (data.analysisId) {
          if (activeTab === 'social' && !isFree) {
            // Se for versão completa do nome social do analista, redireciona diretamente para o relatório HTML
            window.location.href = `/app/resultado/${data.analysisId}`;
            return;
          }

          try {
            // Atualiza status do modal para baixar o PDF
            setPdfModal({
              isOpen: true,
              status: 'loading',
              message: 'Preparando o arquivo PDF...',
            });

            const pdfUrl = `/api/generate-pdf?id=${data.analysisId}&t=${Date.now()}`;
            const pdfRes = await fetch(pdfUrl, {
              cache: 'no-store',
              credentials: 'same-origin',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
            });
            
            if (!pdfRes.ok) throw new Error('pdf_error');

            const blob = await pdfRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Define o nome amigável do arquivo
            const cleanName = nomeCompleto.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            a.download = `analise-${productType}-${cleanName}.pdf`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setPdfModal({
              isOpen: true,
              status: 'success',
              message: 'Download realizado com sucesso!',
            });
          } catch (pdfErr) {
            console.error('Erro ao baixar PDF via Blob:', pdfErr);
            // Fallback caso falhe: tenta abrir na aba nova
            window.open(`/api/generate-pdf?id=${data.analysisId}&t=${Date.now()}`, '_blank');
            setPdfModal({
              isOpen: true,
              status: 'success',
              message: 'Salvo com sucesso! PDF aberto em nova aba.',
            });
          }
        } else {
          setPdfModal({
            isOpen: true,
            status: 'success',
            message: 'Salvo com sucesso!',
          });
        }
      } else {
        const errMsg = data.error || 'Erro ao salvar a análise.';
        setSaveError(errMsg);
        setPdfModal({
          isOpen: true,
          status: 'error',
          message: errMsg,
        });
      }
    } catch (err) {
      const errMsg = 'Falha na comunicação com o servidor.';
      setSaveError(errMsg);
      setPdfModal({
        isOpen: true,
        status: 'error',
        message: errMsg,
      });
    } finally {
      setSaving(false);
    }
  };



  const hasResults = !!(
    (activeTab === 'social' && socialResult) ||
    (activeTab === 'baby' && babyResult) ||
    (activeTab === 'company' && companyResult)
  );

  const isReduced = isScrollingDown && !isForceOpen && hasResults;

  const shouldLockScroll = activeTab === 'social' && !hasResults;

  return (
    <div 
      className={`flex flex-col h-full ${shouldLockScroll ? 'overflow-hidden' : 'overflow-y-auto'} lg:overflow-hidden custom-scrollbar animate-fade-in text-[#e5e2e1]`}
      onScroll={handleScroll}
    >
      
      {/* CONTAINER 1: HEADER FIXO (Desktop) / NATIVO (Mobile) */}
      <div className="flex-none bg-[#111111] lg:z-30 px-4 lg:px-10 py-4 lg:py-5 border-b border-[#D4AF37]/10 lg:shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="font-cinzel text-xl md:text-3xl font-bold text-white tracking-wide">Área do Analista</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#bea5ff]/10 text-[#bea5ff] border border-[#bea5ff]/20 uppercase tracking-widest flex-shrink-0">
                Admin
              </span>
              <button 
                onClick={() => setShowInfoModal(true)} 
                className="md:hidden ml-auto text-gray-400 p-1.5 bg-white/5 rounded-full border border-white/10"
                title="Informações"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            </div>
            <p className="hidden md:block text-gray-400 text-xs md:text-sm mt-2 max-w-3xl leading-relaxed">
              Crie análises personalizadas em tempo real para parceiros e clientes. Os cálculos de triangulação e bloqueios são executados localmente de forma instantânea.
            </p>
          </div>
        </div>
      </div>

      {/* CONTAINER 2: SELETOR DE ABAS PRINCIPAL */}
      <div 
        className={`flex-none bg-[#111111]/95 backdrop-blur-sm lg:z-20 px-2 lg:px-10 border-b transition-all duration-500 ease-in-out lg:overflow-hidden flex justify-center w-full ${
          isScrollingDown ? 'max-h-0 py-0 border-transparent opacity-0 overflow-hidden' : 'max-h-40 py-3 lg:py-4 border-[#D4AF37]/10 opacity-100'
        }`}
      >
        <div className="flex flex-nowrap lg:flex-wrap gap-2 lg:gap-3 overflow-x-auto hide-scrollbar w-max max-w-full snap-x py-2 px-2">
          <button
            onClick={() => setActiveTab('social')}
            className={`snap-start flex-shrink-0 flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-full font-cinzel font-bold text-[11px] lg:text-sm tracking-wider transition-all duration-300 ${
              activeTab === 'social'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#f2ca50] text-[#131313]'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            ✨ NOME SOCIAL
          </button>
          <button
            onClick={() => setActiveTab('baby')}
            className={`snap-start flex-shrink-0 flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-full font-cinzel font-bold text-[11px] lg:text-sm tracking-wider transition-all duration-300 ${
              activeTab === 'baby'
                ? 'bg-gradient-to-r from-[#bea5ff] to-[#d7c6ff] text-[#131313]'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            👶 NOME DE BEBÊ
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`snap-start flex-shrink-0 flex items-center gap-1.5 lg:gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-full font-cinzel font-bold text-[11px] lg:text-sm tracking-wider transition-all duration-300 ${
              activeTab === 'company'
                ? 'bg-gradient-to-r from-[#bea5ff] to-[#d7c6ff] text-[#131313]'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🏢 EMPRESARIAL
          </button>
        </div>
      </div>

      {/* CONTAINER 3 & 4: SPLIT AREA */}
      <div className="lg:flex-1 lg:overflow-hidden flex flex-col lg:flex-row relative">
        
        {/* CONTAINER 3: LADO ESQUERDO (FORMULÁRIOS) */}
        <div 
          className={`
            bg-[#171717] transition-all duration-500 ease-in-out z-20
            ${isReduced 
              ? 'sticky top-0 max-h-[68px] overflow-hidden shadow-xl border-b border-white/10 lg:relative lg:top-auto lg:max-h-none lg:shadow-none' 
              : 'relative max-h-[1500px] lg:max-h-none'
            }
            lg:w-[450px] xl:w-[500px] lg:flex-none border-b lg:border-b-0 lg:border-r border-white/10 lg:overflow-y-auto custom-scrollbar flex flex-col
          `}
        >
          
          {/* TOPO DO FORMULÁRIO REDUZIDO (Mobile) */}
          <div 
            className="lg:hidden grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 transition-all duration-500 ease-in-out"
            style={{
              maxHeight: isReduced ? '68px' : '0px',
              opacity: isReduced ? 1 : 0,
              transform: isReduced ? 'translateY(0)' : 'translateY(-10px)',
              pointerEvents: isReduced ? 'auto' : 'none',
              overflow: 'hidden',
            }}
          >
            <div className="flex-shrink-0">
              <span className="text-xl">🔮</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest leading-none mb-1">
                {activeTab === 'social' ? 'SOCIAL' : activeTab === 'baby' ? 'BEBÊ' : 'EMPRESARIAL'}
              </span>
              <span className="font-cinzel text-[clamp(11px,3.8vw,16px)] font-bold text-white break-words whitespace-normal leading-snug">
                {activeTab === 'social' ? (socialName || 'Sem nome') : activeTab === 'baby' ? (babyLastName || 'Sem sobrenome') : (partnerName || 'Sem sócio')}
              </span>
            </div>
            <div className="flex-shrink-0">
              <button 
                onClick={() => setIsForceOpen(!isForceOpen)}
                className="text-[11px] font-bold text-[#bea5ff] bg-[#bea5ff]/10 hover:bg-[#bea5ff]/20 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {isForceOpen ? 'Fechar' : 'Editar'}
              </button>
            </div>
          </div>

          {/* CONTEÚDO REAL DO FORMULÁRIO */}
          <div 
            className={`space-y-8 flex-1 transition-all duration-500 ease-in-out ${
              activeTab !== 'social' && !isReduced ? 'pb-[50vh] lg:pb-10' : 'lg:pb-10'
            }`}
            style={mounted && isMobile ? {
              maxHeight: isReduced ? '0px' : '1500px',
              opacity: isReduced ? 0 : 1,
              transform: isReduced ? 'translateY(15px)' : 'translateY(0)',
              padding: isReduced ? '0px' : '20px 16px',
              overflow: 'hidden',
              pointerEvents: isReduced ? 'none' : 'auto',
            } : {
              padding: '2.5rem', // lg:p-10
            }}
          >
            <h2 className="font-cinzel text-lg font-bold text-[#f2ca50] flex items-center gap-2 mb-2">
              🔮 Parâmetros da Consulta
            </h2>

            {activeTab === 'social' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Nome de Nascimento</label>
                  <input
                    type="text"
                    value={socialName}
                    onChange={e => setSocialName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f2ca50] transition-colors"
                    placeholder="Nome completo de nascimento do cliente..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Data de Nascimento</label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={socialBirthDate}
                    onChange={e => setSocialBirthDate(handleDateMask(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f2ca50] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">
                    Nomes Candidatos (Um por linha - Opcional)
                  </label>
                  <textarea
                    value={socialCandidates}
                    onChange={e => setSocialCandidates(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f2ca50] transition-colors font-sans resize-none"
                    placeholder="Ex: Mari&#10;Maria Santos&#10;Mariana Santos..."
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Se você informar nomes candidatos, eles entram no ranking de avaliação. Se deixar vazio, o sistema gerará variações automaticamente ao salvar.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'baby' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">
                    Sobrenome da Família
                  </label>
                  <input
                    type="text"
                    value={babyLastName}
                    onChange={e => setBabyLastName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                    placeholder="Sobrenome a herdar..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">
                    Nomes Candidatos (Um por linha)
                  </label>
                  <textarea
                    value={babyCandidates}
                    onChange={e => setBabyCandidates(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors font-sans"
                    placeholder="Arthur&#10;Gabriel&#10;Lucas..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Data de Nascimento do Bebê</label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={babyBirthDate}
                    onChange={e => setBabyBirthDate(handleDateMask(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Gênero Preferido</label>
                  <select
                    value={babyGender}
                    onChange={e => setBabyGender(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                  >
                    <option value="surpresa">Surpresa</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Nome do Sócio Principal</label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                    placeholder="Nome completo do sócio..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Data de Nascimento do Sócio</label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={partnerBirthDate}
                    onChange={e => setPartnerBirthDate(handleDateMask(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">
                    Nomes Corporativos Candidatos (Um por linha)
                  </label>
                  <textarea
                    value={companyCandidates}
                    onChange={e => setCompanyCandidates(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                    placeholder="Alpha Tech&#10;Alquimia Digital&#10;Soluções Estelares..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Data de Fundação (Opcional)</label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={companyFoundDate}
                    onChange={e => setCompanyFoundDate(handleDateMask(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Ramo de Atividade (Opcional)</label>
                  <input
                    type="text"
                    value={companyArea}
                    onChange={e => setCompanyArea(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                    placeholder="Ex: Consultoria, E-commerce..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Descrição do Negócio (Opcional)</label>
                  <textarea
                    value={companyDesc}
                    onChange={e => setCompanyDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#bea5ff] transition-colors"
                    placeholder="Uma breve frase sobre o propósito da empresa..."
                  />
                </div>
              </div>
            )}

            {/* DICAS RÁPIDAS DE USO */}
            <div className="hidden md:block bg-gradient-to-b from-[#131313] to-black/40 rounded-xl p-3 sm:p-5 border border-white/[0.04] text-xs text-gray-400 leading-relaxed shadow-inner">
              <span className="text-[#f2ca50] font-bold block mb-2">⚡ Modo Instantâneo</span>
              A Área do Analista executa todos os cálculos numerológicos e matemáticos localmente em frações de segundo. Ao salvar, as fórmulas estruturam o relatório no banco e geram o PDF oficial imediatamente.
            </div>
          </div>
        </div>

        {/* CONTAINER 4: LADO DIREITO (RESULTADOS COM SCROLL INDEPENDENTE NO DESKTOP) */}
        <div 
          id="results-container"
          className={`
            lg:h-full lg:overflow-y-auto custom-scrollbar bg-[#121212]
            ${hasResults 
              ? 'flex-1 p-3 sm:p-5 lg:p-10 space-y-8 pb-32' 
              : activeTab === 'social' 
                ? 'flex-1 p-3 sm:p-5 lg:p-10 flex flex-col justify-center' 
                : 'hidden lg:flex flex-1 p-3 sm:p-5 lg:p-10 flex-col justify-center'}
          `}
        >

          {/* ESTADO CARREGANDO */}
          {(socialLoading || babyLoading || companyLoading) && (
            <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm">Calculando frequências estelares e arcanos...</p>
            </div>
          )}

          {/* ESTADO VAZIO: NOME SOCIAL */}
          {activeTab === 'social' && !hasResults && !socialLoading && !babyLoading && !companyLoading && (
            <div className="bg-white/[0.02] rounded-2xl p-4 sm:p-6 lg:p-12 border border-dashed border-white/10 text-center w-full flex flex-col items-center justify-center min-h-[150px] lg:min-h-full">
              <span className="text-3xl lg:text-5xl block mb-2 lg:mb-4">🪐</span>
              <h3 className="font-cinzel text-base lg:text-lg font-bold text-gray-300 mb-1 lg:mb-2">Aguardando Parâmetros</h3>
              <p className="text-gray-500 text-xs lg:text-sm max-w-md mx-auto hidden lg:block">
                Digite um nome e data de nascimento no formulário ao lado para acionar os cálculos matemáticos em tempo real.
              </p>
            </div>
          )}

          {/* ESTADO VAZIO: BEBÊ / EMPRESA (APENAS DESKTOP) */}
          {activeTab !== 'social' && !hasResults && !socialLoading && !babyLoading && !companyLoading && (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-gray-600 font-cinzel text-sm">
              <span className="text-4xl mb-4 opacity-30">⏳</span>
              Preencha o formulário ao lado para gerar a análise.
            </div>
          )}

          {/* RESULTADO: NOME SOCIAL */}
          {activeTab === 'social' && socialResult && !socialLoading && (
            <div className="pt-2">

              {/* CANDIDATOS */}
              {socialResult.nomesCandidatos && socialResult.nomesCandidatos.length > 1 && (
                <>
                  <div className="mb-3 px-1">
                    <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Ranking</p>
                    <h3 className="font-cinzel text-lg font-bold text-white">Nomes Candidatos ({socialResult.nomesCandidatos?.length ?? 0})</h3>
                  </div>
                  <div className="space-y-3 mb-10">
                    {socialResult.nomesCandidatos?.map((candidate: any, idx: number) => {
                      const isSelected = selectedSocialCandidateIdx === idx;
                      const blockCount = candidate.bloqueios?.length ?? 0;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedSocialCandidateIdx(idx)}
                          className={`rounded-2xl p-3 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#bea5ff]/10 ring-1 ring-[#bea5ff]/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-cinzel text-base font-bold text-white">{candidate.nomeCompleto}</p>
                            <p className="text-xs text-gray-500 mt-1">Mot: {candidate.motivacao} · Exp: {candidate.expressao} · Imp: {candidate.impressao}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              blockCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>{blockCount === 0 ? '✓ Sem bloqueios' : `${blockCount} Bloqueio(s)`}</span>
                            <span className="font-cinzel font-bold text-lg text-[#bea5ff]">{candidate.score}<span className="text-xs font-normal"> pts</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* CANDIDATO DETALHES */}
              {(() => {
                const selectedCandidate = socialResult.nomesCandidatos?.[selectedSocialCandidateIdx] || socialResult.melhorNome;
                if (!selectedCandidate) return null;

                const scoreVal: number = selectedCandidate.score ?? 0;
                const scoreColor = scoreVal >= 90 ? 'text-emerald-400' : scoreVal >= 70 ? 'text-lime-400' : scoreVal >= 40 ? 'text-yellow-400' : scoreVal >= 20 ? 'text-orange-400' : 'text-red-500';
                const scoreBg   = scoreVal >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' : scoreVal >= 70 ? 'bg-lime-500/10 border-lime-500/20' : scoreVal >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : scoreVal >= 20 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20';
                const scoreLabel = scoreVal >= 90 ? '⭐ Excelente' : scoreVal >= 70 ? '✅ Bom' : scoreVal >= 40 ? '〜 Aceitável' : scoreVal >= 20 ? '⚠ Não Recomendado' : '🔴 Crítico';

                return (
                  <>
                    {/* SCORE */}
                    <div className={`rounded-2xl border p-4 sm:p-6 flex items-center justify-between gap-4 mb-8 ${scoreBg}`}>
                      <div>
                        <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-gray-500 mb-1">Score Vibracional</p>
                        <p className={`font-cinzel text-4xl font-bold leading-none ${scoreColor}`}>
                          {scoreVal}<span className="text-base font-normal ml-1">pts</span>
                        </p>
                      </div>
                      <span className={`font-cinzel text-sm font-semibold ${scoreColor}`}>{scoreLabel}</span>
                    </div>

                    {/* 5 NÚMEROS */}
                    <div className="mb-3 px-1">
                      <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Vibração do Nome</p>
                      <h3 className="font-cinzel text-lg font-bold text-white">5 Números Principais</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
                      {[
                        { label: 'Destino', sublabel: 'O Chamado', val: socialResult.destino, color: '#0369a1', border: 'rgba(3,105,161,0.55)', bg: 'rgba(3,105,161,0.05)', className: 'col-span-2 md:col-span-1' },
                        { label: 'Motivação', sublabel: 'A Alma', val: selectedCandidate.motivacao, color: '#9A6B00', border: 'rgba(154,107,0,0.55)', bg: 'rgba(154,107,0,0.05)', className: 'col-span-1' },
                        { label: 'Expressão', sublabel: 'O Dom', val: selectedCandidate.expressao, color: '#6d28d9', border: 'rgba(109,40,217,0.55)', bg: 'rgba(109,40,217,0.05)', className: 'col-span-1' },
                        { label: 'Impressão', sublabel: 'A Aparência', val: selectedCandidate.impressao, color: '#be185d', border: 'rgba(190,24,93,0.55)', bg: 'rgba(190,24,93,0.05)', className: 'col-span-1' },
                        { label: 'Missão', sublabel: 'A Vocação', val: selectedCandidate.missao, color: '#15803d', border: 'rgba(21,128,61,0.55)', bg: 'rgba(21,128,61,0.05)', className: 'col-span-1' },
                      ].map(({ label, sublabel, val, color, border, bg, className }) => (
                        <div key={label} className={className} style={{ borderRadius: 16, border: `1.5px solid ${border}`, background: bg, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '2.25rem', fontWeight: 700, color, lineHeight: 1 }}>{val ?? '?'}</div>
                          <div style={{ fontSize: 11, color, opacity: 0.8 }}>{sublabel}</div>
                        </div>
                      ))}
                    </div>

                    {/* TRIÂNGULOS */}
                    <div className="mb-3 px-1">
                      <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Mapa de Triângulos</p>
                      <h3 className="font-cinzel text-lg font-bold text-white">Os 4 Triângulos Numerológicos</h3>
                    </div>
                    <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6 mb-10">
                      <TriangleVisualization
                        vida={selectedCandidate.triangulos?.vida}
                        pessoal={selectedCandidate.triangulos?.pessoal}
                        social={selectedCandidate.triangulos?.social}
                        destino={selectedCandidate.triangulos?.destino}
                        bloqueios={selectedCandidate.bloqueios || []}
                        nome={selectedCandidate.nomeCompleto}
                        productType="nome_social"
                        isFreeAnalysis={false}
                      />
                    </div>

                    {/* DÉBITOS KÁRMICOS */}
                    {selectedCandidate.debitosCarmicos && selectedCandidate.debitosCarmicos.length > 0 && (
                      <div className="mb-10">
                        <div className="mb-3 px-1">
                          <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">O Peso do Passado</p>
                          <h3 className="font-cinzel text-lg font-bold text-white">Débitos Kármicos</h3>
                        </div>
                        <KarmicDebts debitos={selectedCandidate.debitosCarmicos} nomeCompleto={selectedCandidate.nomeCompleto} />
                      </div>
                    )}

                    {/* LIÇÕES KÁRMICAS */}
                    {selectedCandidate.licoesCarmicas && selectedCandidate.licoesCarmicas.length > 0 && (
                      <div className="mb-10">
                        <div className="mb-3 px-1">
                          <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Lacunas Energéticas</p>
                          <h3 className="font-cinzel text-lg font-bold text-white">Lições Kármicas</h3>
                        </div>
                        <KarmicLessons licoes={selectedCandidate.licoesCarmicas} nomeCompleto={selectedCandidate.nomeCompleto} />
                      </div>
                    )}

                    {/* TENDÊNCIAS OCULTAS */}
                    {selectedCandidate.tendenciasOcultas && selectedCandidate.tendenciasOcultas.length > 0 && (
                      <div className="mb-10">
                        <div className="mb-3 px-1">
                          <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Frequências Numéricas</p>
                          <h3 className="font-cinzel text-lg font-bold text-white">Tendências Ocultas</h3>
                        </div>
                        <HiddenTendencies
                          tendencias={selectedCandidate.tendenciasOcultas}
                          frequencias={mapearFrequenciasFront(selectedCandidate.nomeCompleto)}
                          nomeCompleto={selectedCandidate.nomeCompleto}
                        />
                      </div>
                    )}
                  </>
                );
              })()}

              {/* EXPORTAR */}
              <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Relatório</p>
                  <h3 className="font-cinzel text-base font-bold text-white">Baixar Análise</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Gera o PDF oficial e salva no banco.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="button" onClick={(e) => { e.preventDefault(); handleSaveAnalysis(true); }} disabled={saving} className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full text-xs font-bold border border-[#d7c6ff]/40 bg-[#d7c6ff]/10 text-[#d7c6ff] hover:bg-[#d7c6ff]/20 transition-all">Versão Gratuita</button>
                  <button type="button" onClick={(e) => { e.preventDefault(); handleSaveAnalysis(false); }} disabled={saving} className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full text-xs font-bold bg-[#D4AF37] text-black hover:bg-[#f2ca50] transition-all flex items-center justify-center gap-2">
                    {saving && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
                    Versão Completa
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* RESULTADO: NOME DE BEBÊ */}
          {activeTab === 'baby' && babyResult && !babyLoading && (
            <div className="pt-2">

              {/* CANDIDATOS */}
              <div className="mb-3 px-1">
                <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Ranking</p>
                <h3 className="font-cinzel text-lg font-bold text-white">Nomes Candidatos ({babyResult.ranking?.length ?? 0})</h3>
              </div>
              <div className="space-y-3 mb-10">
                {babyResult.ranking?.map((candidate: any, idx: number) => {
                  const isSelected = selectedBabyCandidateIdx === idx;
                  const blockCount = candidate.bloqueios?.length ?? 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedBabyCandidateIdx(idx)}
                      className={`rounded-2xl p-3 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#bea5ff]/10 ring-1 ring-[#bea5ff]/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-cinzel text-base font-bold text-white">{candidate.nomeCompleto}</p>
                        <p className="text-xs text-gray-500 mt-1">Mot: {candidate.motivacao} · Exp: {candidate.expressao} · Imp: {candidate.impressao}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          blockCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{blockCount === 0 ? '✓ Sem bloqueios' : `${blockCount} Bloqueio(s)`}</span>
                        <span className="font-cinzel font-bold text-lg text-[#bea5ff]">{candidate.score}<span className="text-xs font-normal"> pts</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TRIÂNGULOS DO CANDIDATO */}
              {babyResult.ranking?.[selectedBabyCandidateIdx] && (
                <>
                  <div className="mb-3 px-1">
                    <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Mapa de Triângulos</p>
                    <h3 className="font-cinzel text-lg font-bold text-white">{babyResult.ranking[selectedBabyCandidateIdx].nomeCompleto}</h3>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6 mb-10">
                    <TriangleVisualization
                      vida={babyResult.rankingTriangulos?.[selectedBabyCandidateIdx]?.vida}
                      pessoal={babyResult.rankingTriangulos?.[selectedBabyCandidateIdx]?.pessoal}
                      social={babyResult.rankingTriangulos?.[selectedBabyCandidateIdx]?.social}
                      destino={babyResult.rankingTriangulos?.[selectedBabyCandidateIdx]?.destino}
                      bloqueios={babyResult.ranking[selectedBabyCandidateIdx].bloqueios || []}
                      nome={babyResult.ranking[selectedBabyCandidateIdx].nomeCompleto}
                      productType="nome_bebe"
                      isFreeAnalysis={false}
                    />
                  </div>
                </>
              )}

              {/* EXPORTAR */}
              <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Relatório</p>
                  <h3 className="font-cinzel text-base font-bold text-white">Salvar Análise de Bebê</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Gera o PDF oficial e salva no banco.</p>
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); handleSaveAnalysis(false); }} disabled={saving} className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold bg-[#bea5ff] text-black hover:bg-[#d7c6ff] transition-all flex items-center justify-center gap-2">
                  {saving && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
                  Salvar e Gerar PDF
                </button>
              </div>

            </div>
          )}

          {/* RESULTADO: NOME EMPRESARIAL */}
          {activeTab === 'company' && companyResult && !companyLoading && (
            <div className="pt-2">

              {/* CANDIDATOS */}
              <div className="mb-3 px-1">
                <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Ranking</p>
                <h3 className="font-cinzel text-lg font-bold text-white">Nomes Candidatos ({companyResult.ranking?.length ?? 0})</h3>
              </div>
              <div className="space-y-3 mb-10">
                {companyResult.ranking?.map((candidate: any, idx: number) => {
                  const isSelected = selectedCompanyCandidateIdx === idx;
                  const blockCount = candidate.bloqueios?.length ?? 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCompanyCandidateIdx(idx)}
                      className={`rounded-2xl p-3 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#bea5ff]/10 ring-1 ring-[#bea5ff]/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-cinzel text-base font-bold text-white">{candidate.nomeEmpresa}</p>
                        <p className="text-xs text-gray-500 mt-1">Exp: {candidate.expressao} · Missão: {candidate.missao} · Imp: {candidate.impressao}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          blockCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{blockCount === 0 ? '✓ Sem bloqueios' : `${blockCount} Bloqueio(s)`}</span>
                        <span className="font-cinzel font-bold text-lg text-[#bea5ff]">{candidate.score}<span className="text-xs font-normal"> pts</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TRIÂNGULOS DO CANDIDATO */}
              {companyResult.ranking?.[selectedCompanyCandidateIdx] && (
                <>
                  <div className="mb-3 px-1">
                    <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Mapa de Triângulos</p>
                    <h3 className="font-cinzel text-lg font-bold text-white">{companyResult.ranking[selectedCompanyCandidateIdx].nomeEmpresa}</h3>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6 mb-10">
                    <TriangleVisualization
                      vida={companyResult.rankingTriangulos?.[selectedCompanyCandidateIdx]?.vida}
                      pessoal={companyResult.rankingTriangulos?.[selectedCompanyCandidateIdx]?.pessoal}
                      social={companyResult.rankingTriangulos?.[selectedCompanyCandidateIdx]?.social}
                      destino={companyResult.rankingTriangulos?.[selectedCompanyCandidateIdx]?.destino}
                      bloqueios={companyResult.ranking[selectedCompanyCandidateIdx].bloqueios || []}
                      nome={companyResult.ranking[selectedCompanyCandidateIdx].nomeEmpresa}
                      productType="nome_empresa"
                      isFreeAnalysis={false}
                    />
                  </div>
                </>
              )}

              {/* EXPORTAR */}
              <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1">Relatório</p>
                  <h3 className="font-cinzel text-base font-bold text-white">Salvar Análise de Empresa</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Gera o PDF oficial e salva no banco.</p>
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); handleSaveAnalysis(false); }} disabled={saving} className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold bg-[#bea5ff] text-black hover:bg-[#d7c6ff] transition-all flex items-center justify-center gap-2">
                  {saving && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
                  Salvar e Gerar PDF
                </button>
              </div>

            </div>
          )}




          {/* MENSAGENS DE SUCESSO / ERRO */}
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              ✓ {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠ {saveError}
            </div>
          )}



        </div>
      </div>

      {/* MODAL INFORMATIVO MOBILE */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowInfoModal(false)}>
          <div className="bg-[#171717] rounded-2xl p-4 sm:p-6 border border-white/10 max-w-sm w-full space-y-4 shadow-2xl relative animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-cinzel font-bold text-[#D4AF37] text-lg">Sobre a Área</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Crie análises personalizadas em tempo real para parceiros e clientes. Os cálculos de triangulação e bloqueios são executados localmente de forma instantânea.
            </p>
            <div className="bg-[#D4AF37]/10 p-4 rounded-xl border border-[#D4AF37]/20 mt-4">
               <span className="text-[#D4AF37] font-bold text-xs block mb-1">⚡ Modo Instantâneo</span>
               <p className="text-gray-400 text-xs leading-relaxed">Ao salvar, as fórmulas estruturam o relatório no banco e geram o PDF oficial imediatamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE STATUS DO PDF (PORTAL) */}
      {mounted && pdfModal.isOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.58)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && pdfModal.status !== 'loading') setPdfModal(prev => ({ ...prev, isOpen: false })); }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '16px',
              padding: '24px',
              background: '#111111',
              border: '1px solid rgba(212,175,55,0.20)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Status Icon */}
              <div style={{ flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pdfModal.status === 'loading' && (
                  <svg style={{ width: '32px', height: '32px', color: '#D4AF37', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {pdfModal.status === 'success' && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(16,185,129,0.15)' }}>
                    ✓
                  </div>
                )}
                {pdfModal.status === 'error' && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(239,68,68,0.15)' }}>
                    ✕
                  </div>
                )}
              </div>

              {/* Status Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {pdfModal.status === 'loading' && (
                  <>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#e5e2e1', margin: 0, fontFamily: 'Inter, sans-serif' }}>Baixando análise...</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>Preparando o arquivo PDF...</p>
                  </>
                )}
                {pdfModal.status === 'success' && (
                  <>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', margin: 0, fontFamily: 'Inter, sans-serif' }}>Download concluído!</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>{pdfModal.message}</p>
                  </>
                )}
                {pdfModal.status === 'error' && (
                  <>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', margin: 0, fontFamily: 'Inter, sans-serif' }}>Falha ao baixar PDF</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>{pdfModal.message}</p>
                  </>
                )}
              </div>

              {/* Top Close Button */}
              {pdfModal.status !== 'loading' && (
                <button
                  onClick={() => setPdfModal(prev => ({ ...prev, isOpen: false }))}
                  style={{ flexShrink: 0, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}
                  aria-label="Fechar"
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bottom Button */}
            {pdfModal.status !== 'loading' && (
              <div style={{ paddingTop: '4px' }}>
                <button 
                  onClick={() => setPdfModal(prev => ({ ...prev, isOpen: false }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    backgroundColor: '#D4AF37',
                    color: '#131313',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontFamily: 'Cinzel, serif',
                    transition: 'all 0.2s',
                  }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
