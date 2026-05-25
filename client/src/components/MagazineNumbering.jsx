export default function MagazineNumbering({ side, children }) {
  return (
    <div className={`magazine-numbering magazine-numbering-${side}`}>
      {children}
    </div>
  )
}
