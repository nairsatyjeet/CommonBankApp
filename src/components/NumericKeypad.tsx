import React from 'react';
import { Backpack as Backspace } from 'lucide-react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  showEnter?: boolean;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ 
  onKeyPress, 
  onClear, 
  onSubmit,
  showEnter = true 
}) => {
  return (
    <div className="max-w-xs mx-auto mt-6">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            className="pinpad-key"
            onClick={() => onKeyPress(num.toString())}
          >
            {num}
          </button>
        ))}
        <button className="pinpad-key" onClick={onClear}>
          Clear
        </button>
        <button 
          className="pinpad-key" 
          onClick={() => onKeyPress('0')}
        >
          0
        </button>
        {showEnter ? (
          <button 
            className="pinpad-key bg-primary-600 text-white hover:bg-primary-700" 
            onClick={onSubmit}
          >
            Enter
          </button>
        ) : (
          <button 
            className="pinpad-key" 
            onClick={() => onKeyPress('.')}
          >
            .
          </button>
        )}
      </div>
    </div>
  );
};

export default NumericKeypad;