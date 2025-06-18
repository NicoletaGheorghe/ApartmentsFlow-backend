import Sidebar from "../components/Sidebar";

export default function ListingsLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar/>
      <main className="ml-0 md:ml-10 w-full p-6">{children}</main>
    </div>
  );
}
