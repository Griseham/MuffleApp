import React from 'react';

function TailwindTest() {
  return (
    <div className="p-6 max-w-sm mx-auto bg-dark-3 text-white rounded-xl shadow-lg flex items-center space-x-4">
      <div className="shrink-0">
        <div className="h-12 w-12 bg-primary rounded-full"></div>
      </div>
      <div>
        <div className="text-xl font-medium">Tailwind CSS Test</div>
        <p className="text-gray-400">This component uses Tailwind CSS classes</p>
        <p className="mt-2 text-xs">Using our custom Tailwind colors</p>
      </div>
    </div>
  );
}

export default TailwindTest;