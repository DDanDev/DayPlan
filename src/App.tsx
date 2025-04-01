import {MVP} from './Components/MVP'
import dayPlanLogo from '/DayPlan logo.png'
import styled from 'styled-components'

const AppContainer = styled.div`
    width: 100vw;
    margin: 0;
    padding: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: start;
    flex-grow: 1;
`

const Logo = styled.img`
    max-width: 20%;
`

export const App = () => {
    return (
        <AppContainer>
            <a href={'/'}>
                <Logo src={dayPlanLogo} alt='DayPlan - Organize seu tempo' />
            </a>
            <MVP />
        </AppContainer>
    )
}
