import { useChrome } from '../context/ChromeProvider'

export default function SoundToggle() {
  const { musicOn, toggleMusic } = useChrome()
  return (
    <button id="sound" data-on={musicOn ? '1' : '0'} aria-label="toggle music" onClick={toggleMusic}>
      <span className="cap" />
      <span className="eq">
        <i />
        <i />
        <i />
      </span>
    </button>
  )
}
