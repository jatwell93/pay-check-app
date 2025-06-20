import React from 'react';
import { classifications, ageOptions } from '../helpers';
import Form from 'react-bootstrap/Form';

const EmployeeDetails = ({ classification, setClassification, employmentType, setEmploymentType, age, setAge, customRate, setCustomRate }) => {
   const handleCustomRateChange = (event) => setCustomRate(event.target.value);
  
const employmentTypes = ['full-time', 'part-time', 'casual'];
  return (
    <>
    <div className="md:col-span-1 p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold mb-4 text-blue-700">Employee Details</h2>
      
      <div className="mb-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor="classification"
        >

          Classification
        </label>
        <select
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
          id="classification"
          className="w-full p-2 border rounded"
        >
          {classifications.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </div>
       {classification === 'above-award' && (
        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="customRate"
          >
            Custom Hourly Rate
          </label>
          <input type="number" id="customRate" className="w-full p-2 border rounded" value={customRate} onChange={handleCustomRateChange} min={0} />
        </div>
      )}


      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Employment Type
        </label>
        <div className="mb-3">
          {['full-time', 'part-time', 'casual'].map(type => (
            <Form.Check key={type} type="radio">
              <Form.Check.Input
                type="radio"
                id={`employmentType-${type}`}
                name="employmentType"
                value={type}
                checked={employmentType === type}
                onChange={() => setEmploymentType(type)}/>
                 <Form.Check.Label>
                {type.charAt(0).toUpperCase() + type.slice(1)}
                </Form.Check.Label>
                </Form.Check>
          ))}
        </div>

      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2" htmlFor="age">
          Age
        </label>
        <select
          id="age"
          className="w-full p-2 border rounded"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          disabled={!['pharmacy-assistant-1', 'pharmacy-assistant-2'].includes(classification)}
        >
          {ageOptions.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
        {!['pharmacy-assistant-1', 'pharmacy-assistant-2'].includes(classification) && (
          <p className="text-xs text-gray-500 mt-1">Junior rates only apply to Pharmacy Assistants Level 1 and 2</p>
        )}
      </div>
    </div>
        </>
  );
};

export default EmployeeDetails;
