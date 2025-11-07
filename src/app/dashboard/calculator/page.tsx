'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/core/utils';
import { useI18n } from '@/shared/i18n/i18n-context';

type AngleMode = 'deg' | 'rad';

interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: number;
}

const scientificButtons: Array<{ label: string; value: string }> = [
  { label: 'sin', value: 'sin(' },
  { label: 'cos', value: 'cos(' },
  { label: 'tan', value: 'tan(' },
  { label: 'asin', value: 'asin(' },
  { label: 'acos', value: 'acos(' },
  { label: 'atan', value: 'atan(' },
  { label: 'log', value: 'log(' },
  { label: 'ln', value: 'ln(' },
  { label: '√', value: 'sqrt(' },
  { label: 'abs', value: 'abs(' },
  { label: 'π', value: 'PI' },
  { label: 'e', value: 'E' },
  { label: '^', value: '^' },
  { label: '%', value: '%' },
  { label: '!', value: '!' },
  { label: 'ANS', value: 'ANS' },
];

const keypadButtons: Array<Array<{ label: string; value: string }>> = [
  [
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: '±', value: 'toggle-sign' },
    { label: 'AC', value: 'clear' },
  ],
  [
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '÷', value: '÷' },
  ],
  [
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '×', value: '×' },
  ],
  [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '−', value: '-' },
  ],
  [
    { label: '0', value: '0' },
    { label: '.', value: '.' },
    { label: 'DEL', value: 'delete' },
    { label: '+', value: '+' },
  ],
];

const evaluateExpression = (rawExpr: string, angleMode: AngleMode) => {
  const factorial = (value: number): number => {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Factorial only defined for non-negative integers');
    }
    let result = 1;
    for (let i = 2; i <= value; i += 1) {
      result *= i;
    }
    return result;
  };

  const toRadians = (value: number) => (angleMode === 'deg' ? (value * Math.PI) / 180 : value);
  const toDegrees = (value: number) => (angleMode === 'deg' ? (value * 180) / Math.PI : value);

  const allowedCharacters = /^[0-9+\-*/().,^%!A-Za-z×÷−]*$/;
  const sanitized = rawExpr.replace(/\s+/g, '');

  if (!allowedCharacters.test(sanitized)) {
    throw new Error('Invalid characters in expression');
  }

  let expression = sanitized
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\^/g, '**')
    .replace(/%/g, '*0.01');

  expression = expression
    .replace(/\bpi\b/gi, 'PI')
    .replace(/\bans\b/gi, 'ANS');

  const factorialPattern = /(\d+(\.\d+)?|\([^()]*\))!/;
  while (factorialPattern.test(expression)) {
    expression = expression.replace(factorialPattern, (_, group) => `factorial(${group})`);
  }

  const context = {
    sin: (x: number) => Math.sin(toRadians(x)),
    cos: (x: number) => Math.cos(toRadians(x)),
    tan: (x: number) => Math.tan(toRadians(x)),
    asin: (x: number) => toDegrees(Math.asin(x)),
    acos: (x: number) => toDegrees(Math.acos(x)),
    atan: (x: number) => toDegrees(Math.atan(x)),
    sqrt: (x: number) => Math.sqrt(x),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    abs: (x: number) => Math.abs(x),
    pow: (x: number, y: number) => Math.pow(x, y),
    PI: Math.PI,
    E: Math.E,
    factorial,
  };

  const fn = new Function(
    ...Object.keys(context),
    `"use strict"; return (${expression});`
  );

  const result = fn(...Object.values(context));
  if (typeof result !== 'number' || Number.isNaN(result) || !Number.isFinite(result)) {
    throw new Error('Calculation error');
  }
  return result;
};

export default function CalculatorPage() {
  const { t } = useI18n();
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [lastAnswer, setLastAnswer] = useState('0');
  const [error, setError] = useState<string | null>(null);

  const formattedHistory = useMemo(
    () =>
      history
        .slice(0, 15)
        .sort((a, b) => b.timestamp - a.timestamp),
    [history]
  );

  const appendToExpression = useCallback((value: string) => {
    setExpression((prev) => prev + value);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setExpression('');
    setResult('0');
    setError(null);
  }, []);

  const handleDelete = useCallback(() => {
    setExpression((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleToggleSign = () => {
    if (!expression) {
      setExpression('-');
      return;
    }

    const match = expression.match(/(-?\d*\.?\d*)$/);
    if (match) {
      const numericPart = match[0];
      const prefix = expression.slice(0, -numericPart.length);
      const toggled =
        numericPart.startsWith('-') && numericPart !== '-'
          ? numericPart.slice(1)
          : numericPart === ''
          ? '-'
          : `-${numericPart}`;
      setExpression(prefix + toggled);
    } else {
      setExpression(expression.startsWith('-') ? expression.slice(1) : `-${expression}`);
    }
    setError(null);
  };

  const handleScientificInput = useCallback((value: string) => {
    if (value === 'ANS') {
      appendToExpression(lastAnswer);
      return;
    }
    appendToExpression(value);
  }, [appendToExpression, lastAnswer]);

  const handleEvaluate = useCallback(() => {
    if (!expression.trim()) {
      return;
    }

    try {
      const normalizedExpression = expression.replace(/ans/gi, 'ANS');
      const preparedExpression = normalizedExpression.replace(/ANS/g, `(${lastAnswer})`);
      const evaluation = evaluateExpression(preparedExpression, angleMode);
      const evaluationResult = Number.isInteger(evaluation)
        ? evaluation.toString()
        : evaluation.toFixed(10).replace(/\.?0+$/, '');

      setResult(evaluationResult);
      setLastAnswer(evaluationResult);
      setHistory((prev) => [
        {
          expression,
          result: evaluationResult,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      setError(null);
    } catch (calcError) {
      setError(
        calcError instanceof Error
          ? calcError.message
          : t('calculator.errorMessage')
      );
    }
  }, [angleMode, expression, lastAnswer, t]);

  const handleKeypadClick = (value: string) => {
    switch (value) {
      case 'clear':
        handleClear();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'toggle-sign':
        handleToggleSign();
        break;
      default:
        appendToExpression(value);
    }
  };

  const handleHistoryRestore = (entry: HistoryEntry) => {
    setExpression(entry.expression);
    setResult(entry.result);
    setError(null);
  };

  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const { key } = event;

      if (/^\d$/.test(key)) {
        event.preventDefault();
        appendToExpression(key);
        return;
      }

      switch (key) {
        case '.':
          event.preventDefault();
          appendToExpression('.');
          return;
        case '+':
          event.preventDefault();
          appendToExpression('+');
          return;
        case '-':
          event.preventDefault();
          appendToExpression('-');
          return;
        case '*':
          event.preventDefault();
          appendToExpression('×');
          return;
        case '/':
          event.preventDefault();
          appendToExpression('÷');
          return;
        case '(':
        case ')':
        case '^':
        case '%':
        case '!':
          event.preventDefault();
          appendToExpression(key);
          return;
        case 'Backspace':
          event.preventDefault();
          handleDelete();
          return;
        case 'Delete':
        case 'Escape':
          event.preventDefault();
          handleClear();
          return;
        case 'Enter':
        case '=':
          event.preventDefault();
          handleEvaluate();
          return;
        default:
          break;
      }

      if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        const upperKey = key.toUpperCase();
        if (upperKey === 'P' && event.shiftKey) {
          appendToExpression('PI');
        } else if (upperKey === 'E' && event.shiftKey) {
          appendToExpression('E');
        } else {
          appendToExpression(key.toLowerCase());
        }
      }
    };

    window.addEventListener('keydown', keydownHandler);
    return () => {
      window.removeEventListener('keydown', keydownHandler);
    };
  }, [appendToExpression, handleClear, handleDelete, handleEvaluate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t('calculator.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('calculator.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('calculator.angleMode')}</span>
          <Button
            variant={angleMode === 'deg' ? 'default' : 'outline'}
            onClick={() => setAngleMode('deg')}
            size="sm"
          >
            {t('calculator.degrees')}
          </Button>
          <Button
            variant={angleMode === 'rad' ? 'default' : 'outline'}
            onClick={() => setAngleMode('rad')}
            size="sm"
          >
            {t('calculator.radians')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle>{t('calculator.calculator')}</CardTitle>
            <CardDescription>{t('calculator.calculatorDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-right">
              <div className="text-sm text-muted-foreground break-all min-h-[24px]">
                {expression || t('calculator.hint')}
              </div>
              <div className="text-3xl font-semibold mt-2">{result}</div>
            </div>
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {scientificButtons.map((button) => (
                <Button
                  key={button.label}
                  type="button"
                  variant="secondary"
                  className="h-12 text-sm"
                  onClick={() => handleScientificInput(button.value)}
                >
                  {button.label}
                </Button>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-4 gap-2">
              {keypadButtons.map((row, rowIndex) =>
                row.map((button, columnIndex) => (
                  <Button
                    key={`${rowIndex}-${columnIndex}-${button.value}`}
                    type="button"
                    variant={
                      ['+', '-', '×', '÷'].includes(button.label)
                        ? 'secondary'
                        : button.value === 'clear'
                        ? 'destructive'
                        : 'outline'
                    }
                    className="h-14 text-lg font-semibold"
                    onClick={() => handleKeypadClick(button.value)}
                  >
                    {button.label}
                  </Button>
                ))
              )}
              <Button
                type="button"
                variant="default"
                className="col-span-4 h-14 text-lg font-semibold"
                onClick={handleEvaluate}
              >
                {t('calculator.equals')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle>{t('calculator.history')}</CardTitle>
            <CardDescription>{t('calculator.historyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formattedHistory.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t('calculator.noHistory')}
              </div>
            ) : (
              formattedHistory.map((entry) => (
                <button
                  key={entry.timestamp}
                  type="button"
                  onClick={() => handleHistoryRestore(entry)}
                  className="w-full rounded-md border p-3 text-left transition hover:bg-muted/70"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    <Badge variant="outline">ANS</Badge>
                  </div>
                  <div className="mt-1 font-mono text-sm">{entry.expression}</div>
                  <div className="text-right font-semibold text-base">{entry.result}</div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
