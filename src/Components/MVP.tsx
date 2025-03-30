import {useState, useEffect} from 'react'
import {Authenticator, Button, Text, TextField, Heading, Flex, View} from '@aws-amplify/ui-react'
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
type List = DayTaskSchema['Lists']['type']
const ListTitles: Record<List, string> = {
    TODAY: 'Hoje',
    BACKLOG: 'Lista',
    DONE: 'Descarte',
}

import styled from 'styled-components'
import {ColorDefinition, generateColors} from '../tools/colorPaletteGenerator'

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
    const [currentList, setCurrentList] = useState<List>('TODAY')
    const [showAdd, setShowAdd] = useState<boolean>(false)
    const [selectedTask, setSelectedTask] = useState<DayTask>()
    const [categoryColors, setCategoryColors] = useState<Record<string, ColorDefinition | undefined>>({})

    useEffect(
        () => {
            const sub = client.models.DayTask.observeQuery({
                // filter: {list: {eq: currentList}}
            }).subscribe({
                next: ({items}) => {
                    console.log(items)
                    setDayTasks([...items])
                },
                error: (error) => {
                    console.error('subscribe error', error)
                    alert(error)
                },
            })

            return () => {
                sub.unsubscribe()
            }
        },
        [
            // currentList
        ],
    )

    useEffect(() => {
        const categories = Array.from(new Set(dayTasks.map((t) => t.category)).values())
        const colors = generateColors({nOfColors: Math.max(categories.length, 4)})
        setCategoryColors(Object.fromEntries(categories.map((c, i) => [c, colors[i]])))
    }, [dayTasks])

    // const fetchDayTasks = async () => {
    //     // replace for subscription
    //     const {data: notes} = await client.models.DayTask.list()
    //     console.log(notes)
    //     setDayTasks(notes)
    // }

    const createTask: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()

        void (async () => {
            const form = new FormData(event.target as HTMLFormElement)

            const {data: _newTask} = await client.models.DayTask.create({
                title: form.get('title') as string,
                description: form.get('description') as string,
                category: form.get('category') as string,
                list: currentList,
                priority: false, // TODO
                recurrence: {once: true}, // TODO
                moveToTodayOn: undefined, // TODO
                enablePriorityOn: undefined, // TODO
                lastCompleted: undefined, // TODO
            })

            console.log(_newTask)

            // void fetchDayTasks() // replace for subscription
            ;(event.target as HTMLFormElement).reset()
            setShowAdd(false)
        })()
    }

    const updateTask = (dayTask: DayTask, changeset: Partial<DayTask>) => {
        void client.models.DayTask.update({id: dayTask.id, ...changeset})
    }

    const deleteTask = async ({id, title}: DayTask) => {
        if (confirm(`Tem certeza que deseja deletar ${title}?`)) {
            await client.models.DayTask.delete({id})
            setSelectedTask(undefined)
        }
    }

    const toggleCompleteTask = (dayTask: DayTask) => {
        const isComplete = isCompletedToday(dayTask)
        const hasRecurrenceRule = dayTask.recurrence.once === false
        const now = new Date().toISOString()

        let list: List
        let lastCompleted: string | null | undefined
        if (!isComplete && !hasRecurrenceRule) {
            list = 'DONE'
            lastCompleted = now
        } else if (!isComplete && hasRecurrenceRule) {
            list = 'BACKLOG'
            lastCompleted = now
        } else if (isComplete && !hasRecurrenceRule) {
            list = 'TODAY'
            lastCompleted = null
        } else {
            // (isComplete && hasRecurrenceRule)
            list = 'BACKLOG'
            lastCompleted = undefined
        }

        updateTask(dayTask, {lastCompleted, list})
    }

    const isCompletedToday = (dayTask: DayTask): boolean => {
        if (!dayTask.lastCompleted) {
            return false
        }
        if (dayTask.list === 'DONE') {
            return true
        }
        const lastCompleted = new Date(dayTask.lastCompleted)
        const now = new Date()
        return (
            lastCompleted.getDate() === now.getDate() &&
            lastCompleted.getMonth() === now.getMonth() &&
            lastCompleted.getFullYear() === now.getFullYear()
        )
    }

    return (
        <MVPContainer>
            <Authenticator>
                {({signOut}) => (
                    <Flex className='App' justifyContent='center' alignItems='center' direction='column' width='70%' margin='0 auto'>
                        {showAdd ? (
                            <View as='form' onSubmit={createTask}>
                                <Heading level={2}>Adicionar</Heading>
                                <Flex
                                    direction='column'
                                    justifyContent='center'
                                    gap='1rem'
                                    padding='2rem'
                                    style={{background: '#347'}}
                                    position={'relative'}
                                >
                                    <Button
                                        variation='menu'
                                        alignSelf={'end'}
                                        onClick={() => {
                                            setShowAdd(false)
                                        }}
                                        color={'#ccc'}
                                        position={'absolute'}
                                        top={0}
                                        right={0}
                                    >
                                        X
                                    </Button>
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
                        ) : !selectedTask ? (
                            <Flex direction={'column'} gap={0}>
                                {/* Component: TaskList */}
                                <Heading level={2}>{ListTitles[currentList]}</Heading>
                                {dayTasks
                                    .filter((t) => t.list === currentList)
                                    .map((dayTask) => (
                                        <Flex
                                            key={dayTask.id}
                                            justifyContent='end'
                                            alignItems='center'
                                            gap='1rem'
                                            border='1px solid #ccc'
                                            padding='1rem'
                                            onClick={() => {
                                                setSelectedTask(dayTask)
                                            }}
                                            backgroundColor={dayTask.priority ? categoryColors[dayTask.category]?.baseColor : undefined}
                                            width={'100vw'}
                                            // onMouseOver={(e) => {
                                            //     // e.currentTarget.style.outline = 'solid 3px #99f' // TODO think of something better to highlight each item is selectable
                                            // }}
                                            // onMouseOut={(e) => {
                                            //     // e.currentTarget.style.outline = 'unset'
                                            // }}
                                        >
                                            <Flex
                                                direction={'column'}
                                                justifyContent={'space-between'}
                                                flex={'1'}
                                                alignItems={'start'}
                                                textAlign={'left'}
                                            >
                                                <Text fontWeight={600}>{dayTask.title}</Text>
                                                {dayTask.time && <Text>{dayTask.time}</Text>}
                                            </Flex>
                                            <Text
                                                backgroundColor={categoryColors[dayTask.category]?.offsetColor}
                                                padding={'1rem'}
                                                borderRadius={'0.5rem'}
                                                fontWeight={600}
                                                width={'6rem'}
                                                isTruncated={true}
                                            >
                                                {dayTask.category}
                                            </Text>
                                            <Text
                                                backgroundColor={dayTask.list === 'DONE' ? '#c11' : '#aaa'}
                                                color={dayTask.list === 'DONE' ? '#ddd' : '#555'}
                                                border={'solid 1px black'}
                                                height={'1.5rem'}
                                                width={'1.5rem'}
                                                fontWeight={900}
                                                borderRadius={'100%'}
                                                onClick={(e) => {
                                                    e.stopPropagation()

                                                    switch (dayTask.list) {
                                                        case 'TODAY':
                                                            updateTask(dayTask, {list: 'BACKLOG'})
                                                            break
                                                        case 'BACKLOG':
                                                            updateTask(dayTask, {list: 'TODAY'})
                                                            break
                                                        case 'DONE':
                                                            deleteTask(dayTask)
                                                            break
                                                    }
                                                }}
                                                lineHeight={'1.4rem'}
                                                style={{cursor: 'pointer'}}
                                            >
                                                {dayTask.list === 'BACKLOG' ? '+' : 'X'}
                                            </Text>
                                            <Text
                                                backgroundColor={dayTask.priority ? '#000' : 'unset'}
                                                color={dayTask.priority ? '#fff' : '#000'}
                                                border={'solid 1px black'}
                                                height={'1.5rem'}
                                                width={'1.5rem'}
                                                fontWeight={900}
                                                borderRadius={'100%'}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    updateTask(dayTask, {priority: !dayTask.priority})
                                                }}
                                                lineHeight={'1.4rem'}
                                                style={{cursor: 'pointer'}}
                                            >
                                                !
                                            </Text>
                                            <Text
                                                border={'solid 1px black'}
                                                height={'1.5rem'}
                                                width={'1.5rem'}
                                                fontWeight={900}
                                                borderRadius={'100%'}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleCompleteTask(dayTask)
                                                }}
                                                lineHeight={'1.1rem'}
                                                style={{cursor: 'pointer'}}
                                            >
                                                {isCompletedToday(dayTask) ? '✔️' : undefined}
                                            </Text>
                                        </Flex>
                                    ))}
                            </Flex>
                        ) : (
                            <Flex direction={'column'} backgroundColor={'#123'} position={'relative'}>
                                {/* TaskFS */}
                                <Button
                                    variation='menu'
                                    alignSelf={'end'}
                                    onClick={() => {
                                        setSelectedTask(undefined)
                                    }}
                                    color={'#ccc'}
                                    position={'absolute'}
                                    top={'0'}
                                    right={'0'}
                                >
                                    X
                                </Button>
                                {Object.entries(selectedTask)
                                    .filter((prop) => !['id', 'owner'].includes(prop[0]))
                                    .map((prop) => (
                                        <Text key={prop[0]} color={'#f1f1f1'}>{`${prop[0]}: ${JSON.stringify(prop[1])}`}</Text>
                                    ))}
                                <Button
                                    variation='destructive'
                                    fontWeight={300}
                                    fontSize={'0.5rem'}
                                    onClick={() => {
                                        void deleteTask(selectedTask)
                                    }}
                                >
                                    Deletar
                                </Button>
                            </Flex>
                        )}
                        {!showAdd && currentList !== 'DONE' && (
                            <Button
                                onClick={() => {
                                    setShowAdd(true)
                                }}
                                backgroundColor={'#373'}
                                color={'#f1f1f1'}
                                fontWeight={900}
                            >
                                +
                            </Button>
                        )}
                        <Flex>
                            {client.enums.Lists.values().map((list) => (
                                <Button
                                    key={list + 'selector'}
                                    onClick={() => {
                                        setCurrentList(list)
                                        setSelectedTask(undefined)
                                    }}
                                    color={currentList === list ? '#fff' : '#000'}
                                    backgroundColor={currentList === list ? '#347' : '#eee'}
                                    disabled={currentList === list}
                                    fontWeight={300}
                                >
                                    {ListTitles[list]}
                                </Button>
                            ))}
                        </Flex>
                        <Button onClick={signOut} backgroundColor={'#333'} color={'#aaa'} fontWeight={300} fontSize={'0.5rem'}>
                            Sair da conta
                        </Button>
                    </Flex>
                )}
            </Authenticator>
        </MVPContainer>
    )
}
