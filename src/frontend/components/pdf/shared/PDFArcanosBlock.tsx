import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

import { TITLE_FONT, BODY_FONT, BODY_FONT_BOLD } from './PDFFonts';

const GRAY = '#4B5563';

// Cores Padronizadas (Roxo Místico) para o Bloco de Arcanos
const THEME_PURPLE = '#7C3AED';
const BG_PURPLE = '#F5F3FF';

interface PDFArcanosBlockProps {
  title: string;
  titleColor?: string;
  arcanoRegente?: {
    numero: number;
    nome: string;
    palavraChave: string;
    descricao: string;
    desafio: string;
  } | null;
  arcanosDePassagem?: number[];
  arcanoAtual?: {
    numero: number | null;
    periodo: string;
    idadeInicio: number;
    idadeFim: number;
    indice?: number; // Índice cronológico do arcano atual
  };
  arcanoAtualDescricao?: string;
  /** Quando true, oculta a nota de rodapé "ver seção de anexos" */
  hideNote?: boolean;
}

export function PDFArcanosBlock({
  title,
  titleColor = '#7C3AED',
  arcanoRegente,
  arcanosDePassagem,
  arcanoAtual,
  arcanoAtualDescricao,
  hideNote = false,
}: PDFArcanosBlockProps) {
  
  if (!arcanoRegente) return null;

  return (
    <View style={{ marginTop: 14 }}>
      {/* (Subtitulo) Arcanos - Triangulo da... */}
      <Text style={{ 
        fontSize: 11,
        fontFamily: TITLE_FONT,
        color: titleColor,
        borderBottomWidth: 1,
        borderBottomColor: titleColor,
        paddingBottom: 4,
        marginBottom: 10,
        letterSpacing: 0.5,
      }}>
        {title}
      </Text>

      <View wrap={false}>
        {/* Arcano Regente */}
        <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 8, textAlign: 'justify' }}>
          <Text style={{ fontFamily: BODY_FONT_BOLD, color: THEME_PURPLE }}>Arcano Regente {arcanoRegente.numero}: {arcanoRegente.nome} — </Text>
          {arcanoRegente.descricao}
        </Text>

        {/* Arcano de Trânsito */}
        {arcanoAtual && arcanoAtual.numero && (
          <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.65, marginBottom: 12, textAlign: 'justify' }}>
            <Text style={{ fontFamily: BODY_FONT_BOLD, color: THEME_PURPLE }}>
              Arcano de Trânsito {arcanoAtual.numero} — {arcanoAtual.periodo} (Idade {arcanoAtual.idadeInicio} a {arcanoAtual.idadeFim}) — 
            </Text>
            {' '}{arcanoAtualDescricao || 'O Arcano de Trânsito revela a energia que governa o seu aqui e agora. É a frequência de colheita, provação ou renovação que você está atravessando neste exato momento cronológico da sua vida.'}
          </Text>
        )}

        {/* Sequência de Passagem */}
        {arcanosDePassagem && arcanosDePassagem.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ 
              fontSize: 10, 
              color: THEME_PURPLE, 
              fontFamily: BODY_FONT_BOLD, 
              marginBottom: 4 
            }}>
              Sequência de Passagem (Cronologia)
            </Text>
            <Text style={{ fontSize: 9, color: GRAY, fontStyle: 'italic', marginBottom: 8 }}>
              Duração de cada ciclo: ~{(90 / arcanosDePassagem.length).toFixed(1).replace('.', ',')} anos
            </Text>

            {/* Texto explicativo sobre o que é a sequência cronológica dos arcanos de passagem */}
            <Text style={{ fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 10, textAlign: 'justify' }}>
              Os Arcanos de Passagem representam o mapa do tempo e a jornada evolutiva ao longo de toda a sua existência. Cada círculo abaixo corresponde a um ciclo vibracional de aproximadamente {(90 / arcanosDePassagem.length).toFixed(1).replace('.', ',')} anos. Esta ordem cronológica descreve as energias que governaram o seu passado (em cinza), o portal vibracional ativo que você está atravessando no seu presente (em roxo) e as sementes do destino que florescerão no seu futuro (em dourado).
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {arcanosDePassagem.map((arcano, idx) => {
                // Determina o estado temporal do ciclo
                let state: 'past' | 'present' | 'future' = 'future';
                
                if (arcanoAtual && arcanoAtual.indice !== undefined) {
                  if (idx < arcanoAtual.indice) {
                    state = 'past';
                  } else if (idx === arcanoAtual.indice) {
                    state = 'present';
                  } else {
                    state = 'future';
                  }
                } else {
                  // Fallback: se não temos o índice do trânsito
                  const isAtual = arcanoAtual && arcano === arcanoAtual.numero;
                  if (isAtual) state = 'present';
                }

                let bgColor = BG_PURPLE;
                let borderColor = THEME_PURPLE;
                let textColor = THEME_PURPLE;

                if (state === 'past') {
                  bgColor = '#F3F4F6';
                  borderColor = '#9CA3AF';
                  textColor = '#9CA3AF';
                } else if (state === 'present') {
                  bgColor = THEME_PURPLE;
                  borderColor = THEME_PURPLE;
                  textColor = '#FFFFFF';
                } else {
                  // Futuro: Dourado "The Celestial Alchemist"
                  bgColor = '#FFFDF0';
                  borderColor = '#D4AF37';
                  textColor = '#8A661C';
                }

                return (
                  <View key={`arcano-${idx}`} style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: bgColor,
                    borderWidth: 1,
                    borderColor: borderColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                    marginRight: 6
                  }}>
                    <Text style={{
                      fontFamily: BODY_FONT_BOLD,
                      fontSize: 8,
                      color: textColor
                    }}>
                      {arcano}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Legenda das bolinhas atualizada com as 3 cores */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#9CA3AF', marginRight: 4 }} />
                <Text style={{ fontSize: 8, color: GRAY }}>Ciclos já vivenciados (Passado)</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: THEME_PURPLE, marginRight: 4 }} />
                <Text style={{ fontSize: 8, color: GRAY }}>Momento ativo na sua vida (Presente)</Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#D4AF37', marginRight: 4 }} />
                <Text style={{ fontSize: 8, color: GRAY }}>Ciclos futuros de evolução (Futuro)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Aviso Anexos */}
        {!hideNote && (
          <Text style={{ fontSize: 9, color: GRAY, fontStyle: 'italic', marginTop: 4 }}>
            * O significado completo de todos os arcanos presentes na sua análise encontra-se na seção de anexos ao final deste documento.
          </Text>
        )}
      </View>
    </View>
  );
}
