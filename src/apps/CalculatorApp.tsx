// Calculator Application - Gesture-Based Calculator

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalculatorAppProps {
  windowId: string;
}

interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

type CalculatorMode = 'standard' | 'scientific';

export const CalculatorApp: React.FC<CalculatorAppProps> = ({ windowId }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [mode, setMode] = useState<CalculatorMode>('standard');
  const [showHistory, setShowHistory] = useState(false);
  const [memory, setMemory] = useState(0);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      
      // Add to history
      addToHistory(`${currentValue} ${operation} ${inputValue}`, String(newValue));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performScientificOperation = (func: string) => {
    const inputValue = parseFloat(display);
    let result: number;

    switch (func) {
      case 'sin':
        result = Math.sin(inputValue * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(inputValue * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(inputValue * Math.PI / 180);
        break;
      case 'log':
        result = Math.log10(inputValue);
        break;
      case 'ln':
        result = Math.log(inputValue);
        break;
      case 'sqrt':
        result = Math.sqrt(inputValue);
        break;
      case 'square':
        result = inputValue * inputValue;
        break;
      case 'cube':
        result = inputValue * inputValue * inputValue;
        break;
      case 'factorial':
        result = factorial(inputValue);
        break;
      case '1/x':
        result = inputValue !== 0 ? 1 / inputValue : 0;
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      default:
        result = inputValue;
    }

    setDisplay(String(result));
    addToHistory(`${func}(${inputValue})`, String(result));
    setWaitingForOperand(true);
  };

  const factorial = (n: number): number => {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const addToHistory = (expression: string, result: string) => {
    const historyItem: CalculationHistory = {
      id: Date.now().toString(),
      expression,
      result,
      timestamp: new Date()
    };
    setHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 calculations
  };

  const memoryStore = () => {
    setMemory(parseFloat(display));
  };

  const memoryRecall = () => {
    setDisplay(String(memory));
    setWaitingForOperand(true);
  };

  const memoryClear = () => {
    setMemory(0);
  };

  const memoryAdd = () => {
    setMemory(memory + parseFloat(display));
  };

  const memorySubtract = () => {
    setMemory(memory - parseFloat(display));
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { key } = event;
      
      if (key >= '0' && key <= '9') {
        inputDigit(key);
      } else if (key === '.') {
        inputDecimal();
      } else if (key === '+') {
        performOperation('+');
      } else if (key === '-') {
        performOperation('-');
      } else if (key === '*') {
        performOperation('×');
      } else if (key === '/') {
        event.preventDefault();
        performOperation('÷');
      } else if (key === 'Enter' || key === '=') {
        performOperation('=');
      } else if (key === 'Escape') {
        clear();
      } else if (key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [display, operation, previousValue, waitingForOperand]);

  const Button: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
  }> = ({ onClick, className = '', children, disabled = false }) => (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`p-4 rounded-lg font-semibold text-lg transition-colors ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
      }`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calculator</h1>
          {memory !== 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded">
              M: {memory}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode(mode === 'standard' ? 'scientific' : 'standard')}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {mode === 'standard' ? 'Scientific' : 'Standard'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            History
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Calculator */}
        <div className="flex-1 flex flex-col">
          {/* Display */}
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="text-right">
              {operation && previousValue !== null && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {previousValue} {operation}
                </div>
              )}
              <div className="text-4xl font-mono text-gray-900 dark:text-white break-all">
                {display}
              </div>
            </div>
          </div>

          {/* Button Grid */}
          <div className="flex-1 p-4">
            {mode === 'standard' ? (
              <div className="grid grid-cols-4 gap-3 h-full">
                {/* Row 1 */}
                <Button onClick={clear} className="bg-red-500 text-white hover:bg-red-600">
                  C
                </Button>
                <Button onClick={clearEntry} className="bg-orange-500 text-white hover:bg-orange-600">
                  CE
                </Button>
                <Button 
                  onClick={() => {
                    if (display.length > 1) {
                      setDisplay(display.slice(0, -1));
                    } else {
                      setDisplay('0');
                    }
                  }}
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  ⌫
                </Button>
                <Button onClick={() => performOperation('÷')} className="bg-blue-500 text-white hover:bg-blue-600">
                  ÷
                </Button>

                {/* Row 2 */}
                <Button onClick={() => inputDigit('7')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  7
                </Button>
                <Button onClick={() => inputDigit('8')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  8
                </Button>
                <Button onClick={() => inputDigit('9')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  9
                </Button>
                <Button onClick={() => performOperation('×')} className="bg-blue-500 text-white hover:bg-blue-600">
                  ×
                </Button>

                {/* Row 3 */}
                <Button onClick={() => inputDigit('4')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  4
                </Button>
                <Button onClick={() => inputDigit('5')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  5
                </Button>
                <Button onClick={() => inputDigit('6')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  6
                </Button>
                <Button onClick={() => performOperation('-')} className="bg-blue-500 text-white hover:bg-blue-600">
                  -
                </Button>

                {/* Row 4 */}
                <Button onClick={() => inputDigit('1')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  1
                </Button>
                <Button onClick={() => inputDigit('2')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  2
                </Button>
                <Button onClick={() => inputDigit('3')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  3
                </Button>
                <Button onClick={() => performOperation('+')} className="bg-blue-500 text-white hover:bg-blue-600">
                  +
                </Button>

                {/* Row 5 */}
                <Button onClick={() => inputDigit('0')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 col-span-2">
                  0
                </Button>
                <Button onClick={inputDecimal} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  .
                </Button>
                <Button onClick={() => performOperation('=')} className="bg-green-500 text-white hover:bg-green-600">
                  =
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2 h-full text-sm">
                {/* Scientific Mode */}
                {/* Row 1 - Memory and Clear */}
                <Button onClick={memoryClear} className="bg-purple-500 text-white hover:bg-purple-600">
                  MC
                </Button>
                <Button onClick={memoryRecall} className="bg-purple-500 text-white hover:bg-purple-600">
                  MR
                </Button>
                <Button onClick={memoryStore} className="bg-purple-500 text-white hover:bg-purple-600">
                  MS
                </Button>
                <Button onClick={memoryAdd} className="bg-purple-500 text-white hover:bg-purple-600">
                  M+
                </Button>
                <Button onClick={memorySubtract} className="bg-purple-500 text-white hover:bg-purple-600">
                  M-
                </Button>
                <Button onClick={clear} className="bg-red-500 text-white hover:bg-red-600">
                  C
                </Button>

                {/* Row 2 - Functions */}
                <Button onClick={() => performScientificOperation('sin')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  sin
                </Button>
                <Button onClick={() => performScientificOperation('cos')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  cos
                </Button>
                <Button onClick={() => performScientificOperation('tan')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  tan
                </Button>
                <Button onClick={() => performScientificOperation('log')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  log
                </Button>
                <Button onClick={() => performScientificOperation('ln')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  ln
                </Button>
                <Button onClick={() => performOperation('÷')} className="bg-blue-500 text-white hover:bg-blue-600">
                  ÷
                </Button>

                {/* Row 3 */}
                <Button onClick={() => performScientificOperation('sqrt')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  √
                </Button>
                <Button onClick={() => performScientificOperation('square')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  x²
                </Button>
                <Button onClick={() => performScientificOperation('cube')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  x³
                </Button>
                <Button onClick={() => inputDigit('7')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  7
                </Button>
                <Button onClick={() => inputDigit('8')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  8
                </Button>
                <Button onClick={() => inputDigit('9')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  9
                </Button>

                {/* Row 4 */}
                <Button onClick={() => performScientificOperation('1/x')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  1/x
                </Button>
                <Button onClick={() => performScientificOperation('factorial')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  n!
                </Button>
                <Button onClick={() => performOperation('×')} className="bg-blue-500 text-white hover:bg-blue-600">
                  ×
                </Button>
                <Button onClick={() => inputDigit('4')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  4
                </Button>
                <Button onClick={() => inputDigit('5')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  5
                </Button>
                <Button onClick={() => inputDigit('6')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  6
                </Button>

                {/* Row 5 */}
                <Button onClick={() => performScientificOperation('pi')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  π
                </Button>
                <Button onClick={() => performScientificOperation('e')} className="bg-indigo-500 text-white hover:bg-indigo-600">
                  e
                </Button>
                <Button onClick={() => performOperation('-')} className="bg-blue-500 text-white hover:bg-blue-600">
                  -
                </Button>
                <Button onClick={() => inputDigit('1')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  1
                </Button>
                <Button onClick={() => inputDigit('2')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  2
                </Button>
                <Button onClick={() => inputDigit('3')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  3
                </Button>

                {/* Row 6 */}
                <Button onClick={() => inputDigit('0')} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 col-span-2">
                  0
                </Button>
                <Button onClick={inputDecimal} className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                  .
                </Button>
                <Button onClick={() => performOperation('+')} className="bg-blue-500 text-white hover:bg-blue-600">
                  +
                </Button>
                <Button onClick={() => performOperation('=')} className="bg-green-500 text-white hover:bg-green-600 col-span-2">
                  =
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
                  <button
                    onClick={() => setHistory([])}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto h-full p-4 space-y-3">
                {history.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center">No calculations yet</p>
                ) : (
                  history.map((item) => (
                    <motion.div
                      key={item.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => {
                        setDisplay(item.result);
                        setWaitingForOperand(true);
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.expression}
                      </div>
                      <div className="font-mono text-lg text-gray-900 dark:text-white">
                        = {item.result}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gesture Hints */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>👆 Point to select numbers</span>
            <span>✋ Swipe for operations</span>
            <span>👌 Pinch to clear</span>
          </div>
          <div className="text-right">
            <span>Keyboard shortcuts supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
