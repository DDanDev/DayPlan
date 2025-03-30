import {useState, useEffect} from 'react'
import {Authenticator, Button, Text, TextField, Heading, Flex, View, Grid, Divider} from '@aws-amplify/ui-react'
import {Amplify} from 'aws-amplify'
import '@aws-amplify/ui-react/styles.css'
import {generateClient} from 'aws-amplify/data'
import type {DayTaskSchema} from '../../amplify/data/resource'
import outputs from '../../amplify_outputs.json'

Amplify.configure(outputs)
const client = generateClient<DayTaskSchema>({
    authMode: 'userPool',
})

type DayTask = DayTaskSchema['DayTask']['type']

import styled from 'styled-components'

const MVPContainer = styled.div`
    .card {
        padding: 2em;
    }

    .read-the-docs {
        color: #888;
    }

    .box:nth-child(3n + 1) {
        grid-column: 1;
    }
    .box:nth-child(3n + 2) {
        grid-column: 2;
    }
    .box:nth-child(3n + 3) {
        grid-column: 3;
    }
`

export const MVP = () => {
    const [dayTasks, setDayTasks] = useState<DayTask[]>([])
    const [currentList, setCurrentList] = useState<DayTaskSchema['Lists']['type']>('TODAY')

    useEffect(() => {
        const sub = client.models.DayTask.observeQuery({filter: {list: {eq: currentList}}}).subscribe({
            next: ({items}) => {
                setDayTasks([...items])
            },
            error: (error) => {
                console.error('subscribe error', error)
                alert(error)
            }
        })

        return () => {
            sub.unsubscribe()
        }
    }, [currentList])

    // const fetchDayTasks = async () => {
    //     // replace for subscription
    //     const {data: notes} = await client.models.DayTask.list()
    //     console.log(notes)
    //     setDayTasks(notes)
    // }

    const createNote: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()

        void (async () => {
            const form = new FormData(event.target as HTMLFormElement)

            const {data: newNote} = await client.models.DayTask.create({
                title: form.get('title') as string,
                description: form.get('description') as string,
                category: form.get('category') as string,
                list: 'TODAY', // TODO
                priority: false, // TODO
                recurrence: {}, // TODO
                moveToTodayOn: undefined, // TODO
                enablePriorityOn: undefined, // TODO
                lastCompleted: undefined, // TODO
            })

            console.log(newNote)

            // void fetchDayTasks() // replace for subscription
            ;(event.target as HTMLFormElement).reset()
        })()
    }

    const deleteNote = async ({id}: DayTask) => {
        const {data: deletedNote} = await client.models.DayTask.delete({id})
        console.log(deletedNote)

        // void fetchDayTasks()
    }

    return (
        <MVPContainer>
            <Authenticator>
                {({signOut}) => (
                    <Flex className='App' justifyContent='center' alignItems='center' direction='column' width='70%' margin='0 auto'>
                        <Heading level={1}>Adicionar</Heading>
                        <View as='form' margin='3rem 0' onSubmit={createNote}>
                            <Flex direction='column' justifyContent='center' gap='2rem' padding='2rem' style={{background: '#347'}}>
                                {(
                                    [
                                        ['title', 'Título'],
                                        ['description', 'Descrição'],
                                        ['category', 'Categoria'],
                                    ] satisfies [string, string][]
                                ).map((input) => (
                                    <TextField
                                        key={`input${input[0]}`}
                                        name={input[0]}
                                        placeholder={input[1]}
                                        label={input[1]}
                                        labelHidden
                                        // variation='quiet'
                                        required
                                    />
                                ))}
                                {/* <View name='image' as='input' type='file' alignSelf={'end'} accept='image/png, image/jpeg' /> */}
                                <Button type='submit' variation='primary'>
                                    Criar
                                </Button>
                            </Flex>
                        </View>
                        <Divider />
                        <Heading level={2}>Hoje</Heading>
                        <Grid margin='3rem 0' autoFlow='column' justifyContent='center' gap='2rem' alignContent='center'>
                            {dayTasks.map((dayTask) => (
                                <Flex
                                    key={dayTask.id}
                                    direction='column'
                                    justifyContent='center'
                                    alignItems='center'
                                    gap='2rem'
                                    border='1px solid #ccc'
                                    padding='2rem'
                                    borderRadius='5%'
                                    className='box'>
                                    <View>
                                        <Heading level={3}>{dayTask.title}</Heading>
                                    </View>
                                    <Text fontStyle='italic'>{dayTask.description}</Text>
                                    <Text fontStyle='italic'>{dayTask.category}</Text>
                                    <Button
                                        variation='destructive'
                                        onClick={() => {
                                            void deleteNote(dayTask)
                                        }}>
                                        Deletar
                                    </Button>
                                </Flex>
                            ))}
                        </Grid>
                        <Flex>
                            <Button
                                onClick={() => {
                                    setCurrentList('TODAY')
                                }}>
                                Hoje
                            </Button>
                            <Button
                                onClick={() => {
                                    setCurrentList('BACKLOG')
                                }}>
                                Lista
                            </Button>
                            <Button
                                onClick={() => {
                                    setCurrentList('DONE')
                                }}>
                                Antigas
                            </Button>
                        </Flex>
                        <Button onClick={signOut}>Sair da conta</Button>
                    </Flex>
                )}
            </Authenticator>
        </MVPContainer>
    )
}
