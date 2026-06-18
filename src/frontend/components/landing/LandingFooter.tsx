import React from 'react';

export function LandingFooter() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 py-12 blog-footer">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <h3 className="font-cinzel text-xl font-bold text-[#D4AF37] mb-3">
              Nome Magnético
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Numerologia cabalística para transformar a vibração do seu nome
              e remover bloqueios energéticos.
            </p>
          </div>

          {/* Produtos */}
          <div>
            <h4 className="text-gray-300 font-medium mb-4 text-sm">Produtos</h4>
            <ul className="space-y-2">
              <li><a href="/nome-social" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Análise de Nome Social</a></li>
              <li><a href="/nome-bebe" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Nome para Bebê</a></li>
              <li><a href="/nome-empresarial" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Nome Empresarial</a></li>
            </ul>
          </div>

          {/* Ferramentas & Conteúdo */}
          <div>
            <h4 className="text-gray-300 font-medium mb-4 text-sm">Ferramentas</h4>
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
            <h4 className="text-gray-300 font-medium mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/privacidade" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Política de Privacidade</a></li>
              <li><a href="/termos" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Termos de Uso</a></li>
              <li><a href="/reembolso" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Política de Reembolso</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Nome Magnético. Todos os direitos reservados.
            </p>
            <p className="text-gray-700 text-xs mt-1">
              Studio MLK — CNPJ 63.865.049/0001-27
            </p>
          </div>
          <p className="text-gray-700 text-xs">
            Numerologia cabalística — fins educacionais e de autoconhecimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
