
import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../../theme.js';

const Card = styled.div`
  background: ${props => props.theme.colors.bg};
  color: ${props => props.theme.colors.text};
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const QuestionText = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  line-height: 1.5;
  
  .highlight {
    background: ${props => props.theme.colors.highlight};
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

const AnswersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const AnswerItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 6px;
  background: ${props => props.theme.colors.bg};
  color: ${props => props.theme.colors.text};
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.theme.colors.infoBg};
  }

  &.correct {
    background: ${props => props.theme.colors.correctBg};
    border-color: ${props => props.theme.colors.correctBorder};
  }

  &.incorrect {
    background: ${props => props.theme.colors.wrongBg};
    border-color: ${props => props.theme.colors.wrongBorder};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const AnswerLabel = styled.span`
  font-weight: bold;
  min-width: 20px;
`;

const ToggleInfo = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  padding: 4px 0;
  
  &:hover {
    opacity: 0.7;
  }
`;

const ExplanationBody = styled.div<{ $show: boolean }>`
  max-height: ${props => props.$show ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: ${props => props.theme.colors.infoBg};
  border-radius: 6px;
  margin-top: 12px;
  
  ${props => props.$show && `
    padding: 16px;
    border: 1px solid #ccc;
  `}
`;

interface Answer {
  key: string;
  text: string;
}

interface QuestionCardProps {
  question: string;
  answers: Answer[];
  correctKey: string;
  explanation?: string;
  onAnswerSelect?: (key: string, isCorrect: boolean) => void;
  selectedAnswer?: string;
  wrongAnswers?: string[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answers,
  correctKey,
  explanation,
  onAnswerSelect,
  selectedAnswer,
  wrongAnswers = []
}) => {
  const [selected, setSelected] = useState<string | null>(selectedAnswer || null);
  const [showInfo, setShowInfo] = useState(false);

  const highlightText = (text: string) => {
    return text.split(/(nicht|falsch|kein|keine|keiner|keinen|wenigsten)/i).map((part, index) =>
      ['nicht', 'falsch', 'kein', 'keine', 'keiner', 'keinen', 'wenigsten'].includes(part.toLowerCase()) ? (
        <span key={index} className="highlight">{part}</span>
      ) : (
        part
      )
    );
  };

  const handleAnswerClick = (answerKey: string) => {
    setSelected(answerKey);
    const isCorrect = answerKey === correctKey;
    onAnswerSelect?.(answerKey, isCorrect);
  };

  const getAnswerClassName = (answerKey: string) => {
    if (selected !== answerKey && !wrongAnswers.includes(answerKey)) return '';
    
    if (answerKey === correctKey) {
      return 'correct';
    } else if (selected === answerKey || wrongAnswers.includes(answerKey)) {
      return 'incorrect';
    }
    return '';
  };

  return (
    <ThemeProvider theme={theme}>
      <Card>
        <QuestionText>
          {highlightText(question)}
        </QuestionText>
        
        <AnswersContainer>
          {answers.map((answer) => (
            <AnswerItem
              key={answer.key}
              className={getAnswerClassName(answer.key)}
              onClick={() => handleAnswerClick(answer.key)}
              disabled={!!selected}
            >
              <AnswerLabel>{answer.key})</AnswerLabel>
              <span>{answer.text}</span>
            </AnswerItem>
          ))}
        </AnswersContainer>

        {explanation && (
          <>
            <ToggleInfo onClick={() => setShowInfo(!showInfo)}>
              ℹ {showInfo ? 'Weniger' : 'Mehr'}
            </ToggleInfo>
            <ExplanationBody $show={showInfo}>
              <div dangerouslySetInnerHTML={{ __html: explanation }} />
            </ExplanationBody>
          </>
        )}
      </Card>
    </ThemeProvider>
  );
};

export default QuestionCard;
