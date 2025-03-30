import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.scss'
import {App} from './App.tsx'
import styled from 'styled-components'

const Footer = styled.footer`
    background-color: #000000;
    color: #fff;
    text-align: center;
    padding: 20px;
    /* width: 100%; */
    & p {
        font-size: 0.5rem;
    }
`

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
        <Footer>
            <p>© 2024 DayPlan. Todos os direitos reservados.</p>
        </Footer>
    </StrictMode>,
)
