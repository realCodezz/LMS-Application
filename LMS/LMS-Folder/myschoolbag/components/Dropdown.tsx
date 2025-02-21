import React from 'react';

interface DropdownProps {
    label: string;
    options: { id: string; name: string }[];
    onSelect: (id: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ label, options, onSelect }) => {
    return (
        <div>
            <label>{label}</label>
            <select onChange={(e) => onSelect(e.target.value)}>
                <option value="">Select</option>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Dropdown;
