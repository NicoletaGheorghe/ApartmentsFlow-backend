export default function Button({ children, onClick, type = "button" }) {
    return (
      <button
        type={type}
        onClick={onClick}
        className="bg-[var(--color-secondary)] text-white px-4 py-2 rounded hover:bg-[var(--color-accent)] transition"
      >
        {children}
      </button>
    );
  }
  