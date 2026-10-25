import React from 'react';

export function LandingFooter() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 py-12 md:py-16 blog-footer">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 w-full">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <h3 className="nm-h4 text-[#D4AF37] mb-3">
              Nome Magnético
            </h3>
            <p className="nm-body">
              Numerologia cabalística para conhecer a nota do seu nome e escolher uma assinatura só sua.
            </p>
          </div>

          {/* Produtos */}
          <div>
            <p className="font-inter text-sm font-semibold text-[#E5E2E1] mb-4">Produto</p>
            <ul className="space-y-2">
              <li><a href="/nome-social" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Análise de Nome Social</a></li>
            </ul>
          </div>

          {/* Ferramentas & Conteúdo */}
          <div>
            <p className="font-inter text-sm font-semibold text-[#E5E2E1] mb-4">Ferramentas</p>
            <ul className="space-y-2">
              <li><a href="/analise-gratuita" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Análise Gratuita</a></li>
              <li><a href="/perguntas-frequentes" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Perguntas Frequentes</a></li>
              <li><a href="/blog" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Blog</a></li>
              <li><a href="/glossario" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Glossário</a></li>
              <li><a href="/suporte" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Suporte</a></li>
              <li><a href="/auth/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Entrar</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-inter text-sm font-semibold text-[#E5E2E1] mb-4">Legal</p>
            <ul className="space-y-2">
              <li><a href="/como-funciona-o-score" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Como calculamos a nota</a></li>
              <li><a href="/privacidade" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Política de Privacidade</a></li>
              <li><a href="/termos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Termos de Uso</a></li>
              <li><a href="/reembolso" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Política de Reembolso</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="nm-caption">
              &copy; {new Date().getFullYear()} Nome Magnético. Todos os direitos reservados.
            </p>
            <p className="nm-caption mt-1">
              Nome Magnético é um produto Studio MLK · CNPJ 63.865.049/0001-27
            </p>
          </div>
          <p className="nm-caption">
            Numerologia cabalística para fins educacionais e de autoconhecimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
