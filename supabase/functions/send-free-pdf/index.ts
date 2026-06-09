import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS check
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Iniciar cliente Supabase com a role de serviço para ler dados do lead
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase ausentes nas variáveis de ambiente da Edge Function");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o lead e os dados do PDF
    const { data: lead, error: fetchError } = await supabase
      .from("free_analyses_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      throw new Error(`Lead não encontrado: ${fetchError?.message}`);
    }

    if (!lead.pdf_base64) {
      throw new Error("Arquivo PDF ainda não foi gerado ou está ausente no registro");
    }

    // Configurar o transporter do SMTP
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || "contato@nomemagnetico.com.br";

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw new Error("Configurações do SMTP (host, port, user, pass) ausentes nas variáveis de ambiente");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpPort === "465", // SSL
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const primeiroNome = lead.nome_completo.split(" ")[0];
    const slugName = lead.nome_completo
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Decodificar PDF base64 para bytes
    const pdfBytes = decode(lead.pdf_base64);

    // Template HTML baseado nas cores "The Celestial Alchemist"
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            background-color: #131313;
            color: #e5e2e1;
            font-family: 'Inter', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            height: 35px;
          }
          .card {
            background-color: #1a1a1a;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            border: 1px solid rgba(212, 175, 55, 0.15);
          }
          h1 {
            color: #f2ca50;
            font-family: 'Cinzel', serif;
            font-size: 24px;
            margin-bottom: 20px;
            letter-spacing: 1px;
          }
          p {
            color: #b0adab;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .highlight {
            color: #e5e2e1;
            font-weight: bold;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #f2ca50, #d4af37);
            color: #131313;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            padding: 15px 35px;
            border-radius: 50px;
            margin: 25px 0;
            transition: all 0.3s ease;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #76746a;
            margin-top: 40px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img class="logo" src="https://nomemagnetico.com.br/logo-nm-header-blog-dark.svg" alt="Nome Magnético">
          </div>
          <div class="card">
            <h1>Olá, ${primeiroNome}</h1>
            <p>O dossiê completo com a análise de nascimento do seu nome <strong>${lead.nome_completo}</strong> já está pronto e foi anexado a este e-mail.</p>
            <p>Seu relatório em PDF inclui a análise detalhada do seu <span class="highlight">Triângulo da Vida</span>, a interpretação dos seus <span class="highlight">5 Números Principais</span> e o Arcano Regente que governa a sua frequência atual.</p>
            <p><strong>Quer dar o próximo passo e remover os bloqueios?</strong> Descubra a sua assinatura de poder ideal com o Nome Social, analisando todas as variações para harmonizar o seu Destino.</p>
            <a class="btn" href="https://nomemagnetico.com.br/nome-social">Harmonizar Meu Nome</a>
          </div>
          <div class="footer">
            <p>Nome Magnético © ${new Date().getFullYear()} · Todos os direitos reservados.<br>
            Você está recebendo este e-mail porque solicitou uma análise gratuita em nosso site.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar e-mail com anexo do PDF
    await transporter.sendMail({
      from: `Nome Magnético <${smtpFrom}>`,
      to: lead.email,
      subject: `${primeiroNome}, sua análise gratuita está pronta! 🛡️`,
      html: htmlBody,
      attachments: [
        {
          filename: `analise-gratuita-${slugName}-nome-magnetico.pdf`,
          content: pdfBytes,
          contentType: "application/pdf",
        },
      ],
    });

    // Atualizar o status do lead para concluído
    await supabase
      .from("free_analyses_leads")
      .update({
        status: "complete",
        completed_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err: any) {
    console.error("[send-free-pdf] erro:", err.message);

    // Se houver leadId, tentar marcar o erro na tabela
    try {
      const { leadId } = await req.json();
      if (leadId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from("free_analyses_leads")
            .update({
              status: "error",
              error_message: err.message,
            })
            .eq("id", leadId);
        }
      }
    } catch {
      // Ignorar erros de gravação de erro
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
