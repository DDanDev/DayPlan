import {MVP} from './Components/MVP'
import dayPlanLogo from '/DayPlan logo.png'
import styled from 'styled-components'
import {Text} from '@aws-amplify/ui-react'

const AppContainer = styled.div`
    max-width: 1280px;
    width: 100vw;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
`

const Logo = styled.img`
    max-width: 20%;
`

export const App = () => {
    return (
        <AppContainer>
            <Logo src={dayPlanLogo} alt='DayPlan - Organize seu tempo' />
            <Text>DayPlan versão alpha 0 em desenvolvimento</Text>
            <MVP />
        </AppContainer>
    )
}
