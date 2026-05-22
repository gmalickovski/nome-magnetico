import React, { useState, useEffect, useRef } from 'react';
import TriangleVisualization from './TriangleVisualization';

export default function AdminGeneralAnalysis() {
  const [activeTab, setActiveTab] = useState<'social' | 'baby' | 'company'>('social');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isForceOpen, setIsForceOpen] = useState(false);

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
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialResult, setSocialResult] = useState<any>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

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
        const res = await fetch('/api/analyze-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome_candidato: socialName,
            data_nascimento_db: socialBirthDate,
          }),
        });

        if (!res.ok) {
          throw new Error('Erro na análise de cálculo do Nome Social');
        }

        const data = await res.json();
        setSocialResult(data);
      } catch (err: any) {
        setSocialError(err?.message || 'Falha ao processar análise');
        setSocialResult(null);
      } finally {
        setSocialLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [socialName, socialBirthDate, activeTab]);

  // --- EFFECT DEBOUNCE: NOME DE BEBÊ ---
  useEffect(() => {
    if (activeTab !== 'baby') return;
    const candidates = babyCandidates
      .split('\n')
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
            data_nascimento: babyBirthDate || '',
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
      .split('\n')
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
          data_nascimento_socio: partnerBirthDate,
        };
        if (companyFoundDate) payload.data_fundacao = companyFoundDate;
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

    let productType: string;
    let nomeCompleto: string;
    let dataNascimento: string;
    let calculatedData: any;
    let extraParams: any = {};

    if (activeTab === 'social') {
      if (!socialResult) return;
      productType = isFree ? 'analise_gratuita' : 'nome_social';
      nomeCompleto = socialName.trim();
      dataNascimento = socialBirthDate;
      calculatedData = socialResult;
    } else if (activeTab === 'baby') {
      if (!babyResult) return;
      productType = 'nome_bebe';
      nomeCompleto = `(bebê) ${babyLastName.trim()}`;
      dataNascimento = babyBirthDate;
      calculatedData = babyResult;
      extraParams = {
        sobrenome_familia: babyLastName.trim(),
        nomes_candidatos: babyCandidates.split('\n').map(c => c.trim()).filter(c => c.length >= 2),
        genero_preferido: babyGender,
      };
    } else {
      if (!companyResult) return;
      productType = 'nome_empresa';
      nomeCompleto = `Sócio: ${partnerName.trim()}`;
      dataNascimento = partnerBirthDate;
      calculatedData = companyResult;
      extraParams = {
        nome_socio_principal: partnerName.trim(),
        data_nascimento_socio: partnerBirthDate,
        data_fundacao: companyFoundDate || null,
        ramo_atividade: companyArea || null,
        descricao_negocio: companyDesc || null,
        nomes_candidatos: companyCandidates.split('\n').map(c => c.trim()).filter(c => c.length >= 2),
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
        setSaveSuccess('Análise salva com sucesso! O PDF está disponível.');
        
        // Abre o PDF em nova aba
        if (data.analysisId) {
          window.open(`/api/generate-pdf?id=${data.analysisId}`, '_blank');
        }
      } else {
        setSaveError(data.error || 'Erro ao salvar a análise.');
      }
    } catch (err) {
      setSaveError('Falha na comunicação com o servidor.');
    } finally {
      setSaving(false);
    }
  };



  const hasResults = !!(
    (activeTab === 'social' && socialResult) ||
    (activeTab === 'baby' && babyResult) ||
    (activeTab === 'company' && companyResult)
  );

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
            bg-[#171717] transition-all duration-500 ease-in-out relative z-10
            ${isScrollingDown && !isForceOpen && hasResults && activeTab === 'social' ? 'max-h-[76px] lg:max-h-none overflow-hidden opacity-60' : 'max-h-[1200px] lg:max-h-none opacity-100'}
            lg:w-[450px] xl:w-[500px] lg:flex-none border-b lg:border-b-0 lg:border-r border-white/10 lg:overflow-y-auto custom-scrollbar flex flex-col
          `}
        >
          
          {/* TOPO DO FORMULÁRIO REDUZIDO (Mobile) */}
          <div className={`lg:hidden flex items-center justify-between p-4 ${isScrollingDown && !isForceOpen && hasResults && activeTab === 'social' ? 'block' : 'hidden'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔮</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider leading-none mb-1">
                  {activeTab === 'social' ? 'Social' : activeTab === 'baby' ? 'Bebê' : 'Empresarial'}
                </span>
                <span className="text-sm font-semibold text-white truncate max-w-[200px] leading-none">
                  {activeTab === 'social' ? (socialName || 'Sem nome') : activeTab === 'baby' ? (babyLastName || 'Sem família') : (partnerName || 'Sem sócio')}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsForceOpen(!isForceOpen)}
              className="text-[11px] font-bold text-[#bea5ff] bg-[#bea5ff]/10 hover:bg-[#bea5ff]/20 px-4 py-2 rounded-xl transition-colors"
            >
              {isForceOpen ? 'Fechar' : 'Editar'}
            </button>
          </div>

          {/* CONTEÚDO REAL DO FORMULÁRIO */}
          <div className={`p-5 lg:p-10 space-y-8 flex-1 transition-opacity duration-300 ${
            activeTab !== 'social' ? 'pb-[50vh] lg:pb-10' : ''
          } ${isScrollingDown && !isForceOpen && hasResults && activeTab === 'social' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <h2 className="font-cinzel text-lg font-bold text-[#f2ca50] flex items-center gap-2 mb-2">
              🔮 Parâmetros da Consulta
            </h2>

            {activeTab === 'social' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={socialName}
                    onChange={e => setSocialName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f2ca50] transition-colors"
                    placeholder="Nome de nascimento do cliente..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={socialBirthDate}
                    onChange={e => setSocialBirthDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f2ca50] transition-colors"
                  />
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
                    type="date"
                    value={babyBirthDate}
                    onChange={e => setBabyBirthDate(e.target.value)}
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
                    type="date"
                    value={partnerBirthDate}
                    onChange={e => setPartnerBirthDate(e.target.value)}
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
                    type="date"
                    value={companyFoundDate}
                    onChange={e => setCompanyFoundDate(e.target.value)}
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
            <div className="hidden md:block bg-gradient-to-b from-[#131313] to-black/40 rounded-xl p-5 border border-white/[0.04] text-xs text-gray-400 leading-relaxed shadow-inner">
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
              ? 'flex-1 p-5 lg:p-10 space-y-8 pb-32' 
              : activeTab === 'social' 
                ? 'flex-1 p-5 lg:p-10 flex flex-col justify-center' 
                : 'hidden lg:flex flex-1 p-5 lg:p-10 flex-col justify-center'}
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
            <div className="bg-white/[0.02] rounded-2xl p-6 lg:p-12 border border-dashed border-white/10 text-center w-full flex flex-col items-center justify-center min-h-[150px] lg:min-h-full">
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
            <div className="flex flex-col space-y-6">
              
              {/* CARD DE AÇÕES E CRIAÇÃO DIRETA */}
              <div className="order-last lg:order-none bg-gradient-to-r from-[#171717] to-[#121212] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-white font-cinzel text-lg font-bold">Baixar Análise</h3>
                  <p className="text-gray-400 text-xs">Salva no banco e abre a impressão do PDF oficial.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleSaveAnalysis(true)}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-full text-xs font-bold border border-[#d7c6ff]/40 bg-[#d7c6ff]/10 text-[#d7c6ff] hover:bg-[#d7c6ff]/20 transition-all"
                  >
                    Versão Gratuita
                  </button>
                  <button
                    onClick={() => handleSaveAnalysis(false)}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-full text-xs font-bold bg-[#D4AF37] text-black hover:bg-[#f2ca50] shadow-lg shadow-[#D4AF37]/10 transition-all flex items-center justify-center gap-2"
                  >
                    {saving && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
                    Versão Completa
                  </button>
                </div>
              </div>

              {/* CARD DOS NÚMEROS E SCORE */}
              <div className="bg-[#171717] rounded-2xl p-6 border border-white/[0.03] grid sm:grid-cols-5 gap-4 text-center">
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Motivação</p>
                  <p className="font-cinzel text-2xl font-bold text-[#f2ca50]">{socialResult.numeros?.motivacao}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Expressão</p>
                  <p className="font-cinzel text-2xl font-bold text-[#f2ca50]">{socialResult.numeros?.expressao}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Destino</p>
                  <p className="font-cinzel text-2xl font-bold text-[#f2ca50]">{socialResult.numeros?.destino}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Missão</p>
                  <p className="font-cinzel text-2xl font-bold text-[#f2ca50]">{socialResult.numeros?.missao}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 sm:col-span-1 col-span-2">
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Score</p>
                  <p className="font-cinzel text-2xl font-bold text-purple-300">{socialResult.score?.total} pts</p>
                </div>
              </div>

              {/* VISUALIZAÇÃO DOS TRIÂNGULOS */}
              <div className="bg-[#171717] rounded-2xl p-6 border border-white/[0.03]">
                <h3 className="text-[#f2ca50] font-cinzel text-base font-bold mb-4">🔺 Triângulos e Bloqueios</h3>
                <TriangleVisualization
                  vida={socialResult.triangulos?.vida}
                  pessoal={socialResult.triangulos?.pessoal}
                  social={socialResult.triangulos?.social}
                  destino={socialResult.triangulos?.destino}
                  bloqueios={socialResult.bloqueios}
                  nome={socialName}
                  productType="nome_social"
                  isFreeAnalysis={false}
                />
              </div>

            </div>
          )}

          {/* RESULTADO: NOME DE BEBÊ */}
          {activeTab === 'baby' && babyResult && !babyLoading && (
            <div className="space-y-6">
              
              {/* CARD DE SALVAR */}
              <div className="bg-gradient-to-r from-[#171717] to-[#121212] border border-[#bea5ff]/20 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-white font-cinzel text-lg font-bold">Salvar Análise de Bebê</h3>
                  <p className="text-gray-400 text-xs">Salva no banco e abre a impressão do PDF oficial.</p>
                </div>
                <div className="w-full sm:w-auto">
                  <button
                    onClick={() => handleSaveAnalysis(false)}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold bg-[#bea5ff] text-black hover:bg-[#d7c6ff] shadow-lg shadow-[#bea5ff]/10 transition-all flex items-center justify-center gap-2"
                  >
                    {saving && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
                    Salvar e Gerar PDF
                  </button>
                </div>
              </div>

              {/* GRID DE CANDIDATOS DO BEBÊ */}
              <div className="bg-[#171717] rounded-2xl p-6 border border-white/[0.03] space-y-4">
                <h3 className="font-cinzel text-base font-bold text-white">📋 Nomes Analisados ({babyResult.ranking?.length ?? 0})</h3>
                <div className="space-y-2">
                  {babyResult.ranking?.map((candidate: any, idx: number) => {
                    const isSelected = selectedBabyCandidateIdx === idx;
                    const blockCount = candidate.bloqueios?.length ?? 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedBabyCandidateIdx(idx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#bea5ff]/10 border-[#bea5ff] shadow-lg shadow-[#bea5ff]/5'
                            : 'bg-black/20 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{candidate.nomeCompleto}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Motivação: {candidate.motivacao} · Expressão: {candidate.expressao} · Impressão: {candidate.impressao}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            blockCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {blockCount === 0 ? 'Sem bloqueios' : `${blockCount} Bloqueio(s)`}
                          </span>
                          <span className="font-cinzel font-bold text-lg text-[#bea5ff]">
                            {candidate.score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DETALHES DO CANDIDATO SELECIONADO (TRIÂNGULOS) */}
              {babyResult.ranking?.[selectedBabyCandidateIdx] && (
                <div className="bg-[#171717] rounded-2xl p-6 border border-white/[0.03] space-y-6">
                  <div>
                    <h4 className="font-cinzel text-base font-bold text-[#bea5ff] mb-1">
                      🔺 Detalhes: {babyResult.ranking[selectedBabyCandidateIdx].nomeCompleto}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Visualizando os 4 triângulos de nascimento deste candidato de bebê.
                    </p>
                  </div>

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
              )}

            </div>
          )}

          {/* RESULTADO: NOME EMPRESARIAL */}
          {activeTab === 'company' && companyResult && !companyLoading && (
            <div className="space-y-6">
              
              {/* CARD DE AÇÃO */}
              <div className="bg-gradient-to-r from-[#171717] to-[#121212] border border-[#bea5ff]/20 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-white font-cinzel text-lg font-bold">Salvar Análise de Empresa</h3>
                  <p className="text-gray-400 text-xs">Salva no banco e abre a impressão do PDF oficial.</p>
                </div>
                <div className="w-full sm:w-auto">
                  <button
                    onClick={() => handleSaveAnalysis(false)}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold bg-[#bea5ff] text-black hover:bg-[#d7c6ff] shadow-lg shadow-[#bea5ff]/10 transition-all flex items-center justify-center gap-2"
                  >
                    {saving && <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
                    Salvar e Gerar PDF
                  </button>
                </div>
              </div>

              {/* GRID DE CANDIDATOS CORPORATIVOS */}
              <div className="bg-[#171717] rounded-2xl p-6 border border-white/[0.03] space-y-4">
                <h3 className="font-cinzel text-base font-bold text-white">📋 Nomes Analisados ({companyResult.ranking?.length ?? 0})</h3>
                <div className="space-y-2">
                  {companyResult.ranking?.map((candidate: any, idx: number) => {
                    const isSelected = selectedCompanyCandidateIdx === idx;
                    const blockCount = candidate.bloqueios?.length ?? 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCompanyCandidateIdx(idx)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#bea5ff]/10 border-[#bea5ff] shadow-lg shadow-[#bea5ff]/5'
                            : 'bg-black/20 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{candidate.nomeEmpresa}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Expressão: {candidate.expressao} · Missão: {candidate.missao} · Impressão: {candidate.impressao}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            blockCount === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {blockCount === 0 ? 'Sem bloqueios' : `${blockCount} Bloqueio(s)`}
                          </span>
                          <span className="font-cinzel font-bold text-lg text-[#bea5ff]">
                            {candidate.score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DETALHES DO CANDIDATO CORPORATIVO (TRIÂNGULOS) */}
              {companyResult.ranking?.[selectedCompanyCandidateIdx] && (
                <div className="bg-[#171717] rounded-2xl p-6 border border-white/[0.03] space-y-6">
                  <div>
                    <h4 className="font-cinzel text-base font-bold text-[#bea5ff] mb-1">
                      🔺 Detalhes: {companyResult.ranking[selectedCompanyCandidateIdx].nomeEmpresa}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Visualizando os 4 triângulos desta opção de nome corporativo.
                    </p>
                  </div>

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
              )}

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
          <div className="bg-[#171717] rounded-2xl p-6 border border-white/10 max-w-sm w-full space-y-4 shadow-2xl relative animate-scale-up" onClick={e => e.stopPropagation()}>
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
    </div>
  );
}
