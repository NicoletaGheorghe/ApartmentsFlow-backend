export default function Input({ label, type = "text", name, value, onChange }) {
    return (
      <div className="mb-4">
        <label htmlFor={name} className="block mb-1 font-semibold text-gray-700">
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
        />
      </div>
    );
  }
  