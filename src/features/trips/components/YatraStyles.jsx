
// Decorative patterns Tailwind cannot express inline; scoped so no shared file changes.
const CSS = `
.yatra-mandala {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23F3D98E' stroke-width='0.8'%3E%3Ccircle cx='100' cy='100' r='30'/%3E%3Ccircle cx='100' cy='100' r='52'/%3E%3Ccircle cx='100' cy='100' r='74'/%3E%3Cg%3E%3Cellipse cx='100' cy='58' rx='13' ry='30'/%3E%3Cellipse cx='100' cy='142' rx='13' ry='30'/%3E%3Cellipse cx='58' cy='100' rx='30' ry='13'/%3E%3Cellipse cx='142' cy='100' rx='30' ry='13'/%3E%3Cellipse cx='70' cy='70' rx='11' ry='26' transform='rotate(45 70 70)'/%3E%3Cellipse cx='130' cy='130' rx='11' ry='26' transform='rotate(45 130 130)'/%3E%3Cellipse cx='130' cy='70' rx='26' ry='11' transform='rotate(45 130 70)'/%3E%3Cellipse cx='70' cy='130' rx='26' ry='11' transform='rotate(45 70 130)'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-size: 420px 420px;
  background-position: center;
}
.yatra-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: translateX(-100%);
  animation: yatra-sweep 1.7s ease-in-out infinite;
}
@keyframes yatra-sweep { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .yatra-shimmer::after { animation: none; } }
`

const YatraStyles = () => <style>{CSS}</style>

export default YatraStyles
