import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.scss'
import {App} from './App.tsx'
import styled from 'styled-components'
import {Flex} from '@aws-amplify/ui-react'

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
        <Flex direction={'column'} justifyContent={'space-between'} minHeight={'100vh'} gap={0}>
            <App />
            <Footer>
                <p>© 2024 DayPlan. Todos os direitos reservados.</p>
                <p>DayPlan versão alpha 0.0.1 em desenvolvimento</p>
            </Footer>
        </Flex>
    </StrictMode>,
)
