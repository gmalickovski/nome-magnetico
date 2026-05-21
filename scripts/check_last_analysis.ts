import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, nome_completo, product_type, analise_texto, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error:', error);
  } else {
    for (const d of data) {
      console.log('---', d.id, d.nome_completo, d.created_at);
      console.log('Product type:', d.product_type);
      console.log('Has Escudo?', d.analise_texto?.includes('Escudo Magnético'));
      const match = d.analise_texto?.match(/## 🛡️ Escudo Magnético de 72 Horas[\s\S]*/i);
      if (match) {
        console.log('Match:', match[0].substring(0, 150));
      } else {
        console.log('No match found in text.');
      }
    }
  }
}

main();
