import React from 'react';

const EmployeeDetails = ({
  classification, setClassification,
  employmentType, setEmploymentType,
  age, setAge,
  customRate, setCustomRate,
  classifications,
  ageOptions,
  juniorClassificationIds
}) => {
  const handleCustomRateChange = (event) => setCustomRate(event.target.value);

  return (
    <div className="md:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b border-slate-200 pb-2 font-heading">Employee Details</h2>

      <div className="mb-4">
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="classification"
        >
          Classification
        </label>
        <select
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
          id="classification"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-700 focus:border-transparent text-gray-700 bg-white"
        >
          {classifications.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </div>

      {classification === 'above-award' && (
        <div className="mb-4">
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="customRate"
          >
            Custom Hourly Rate
          </label>
          <input
            type="number"
            id="customRate"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-700 focus:border-transparent placeholder-gray-400 text-gray-700"
            value={customRate}
            onChange={handleCustomRateChange}
            min={0}
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employment Type
        </label>
        <div className="flex flex-wrap gap-4">
          {['full-time', 'part-time', 'casual'].map(type => (
            <label key={type} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="employmentType"
                value={type}
                checked={employmentType === type}
                onChange={() => setEmploymentType(type)}
                className="accent-teal-700 cursor-pointer"
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="age">
          Age
        </label>
        <select
          id="age"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-700 focus:border-transparent text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          disabled={!juniorClassificationIds.includes(classification)}
        >
          {ageOptions.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
        {!juniorClassificationIds.includes(classification) && (
          <p className="text-xs text-gray-400 mt-1">Junior rates only apply to junior classifications for this award</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetails;
