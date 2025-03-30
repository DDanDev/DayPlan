import dayPlanLogo from '/DayPlan logo.png'
import styled from 'styled-components'

const AppContainer = styled.div`
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
`

const Logo = styled.img`
    max-width: 90%;
`

export const App = () => {
    return (
        <AppContainer>
            <Logo src={dayPlanLogo} alt='DayPlan - Organize seu tempo' />
        </AppContainer>
    )
}
