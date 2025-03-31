import {useState, useEffect} from 'react'
import {Authenticator, Button, Text, TextField, Heading, Flex, View, Label, Input, SwitchField, Autocomplete} from '@aws-amplify/ui-react'
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
    TODAY: 'Fazer Hoje',
    BACKLOG: 'Organizar',
    DONE: 'Lixeira',
}

import styled, {css} from 'styled-components'
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

const inputResets = css`
    &,
    & *,
    &:active,
    & *:active {
        box-shadow: none !important;
        color: #fff !important;
        border-color: #ddd !important; // TODO look into disabling/editing these from amplify instead of !important props
    }
`

const WhiteTextField = styled(TextField)`
    ${inputResets}
`

const WhiteInput = styled(Input)`
    ${inputResets}
`

const WhiteAutocomplete = styled(Autocomplete)`
    &,
    & *,
    &:active,
    & *:active {
        box-shadow: none !important;
        /* color: #fff !important; */
        border-color: #ddd !important; // TODO look into disabling/editing these from amplify instead of !important props
    }
`

export const MVP = () => {
    const [dayTasks, setDayTasks] = useState<DayTask[]>([])
    const [currentList, setCurrentList] = useState<List>('TODAY')
    const [showAdd, setShowAdd] = useState<boolean>(false)
    const [selectedTask, setSelectedTask] = useState<DayTask>()
    const [categoryColors, setCategoryColors] = useState<Record<string, ColorDefinition | undefined>>({})
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [selectedCategoryColor, setSelectedCategoryColor] = useState<ColorDefinition | undefined>(undefined)

    useEffect(() => {
        if (!isAuthenticated) return
        const sub = client.models.DayTask.observeQuery({
            // filter: {list: {eq: currentList}}
        }).subscribe({
            next: ({items}) => {
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
    }, [
        isAuthenticated,
        // currentList
    ])

    useEffect(() => {
        const twentyDaysAgo = new Date()
        twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20)
        const ISOTwentyDaysAgo = twentyDaysAgo.toISOString()

        const categories: string[] = Array.from(
            new Set(
                dayTasks.map((t) => {
                    if (t.list === 'DONE' && t.recurrence.once !== false && t.lastCompleted && t.lastCompleted < ISOTwentyDaysAgo) {
                        deleteTask(t)
                    }

                    return t.category
                }),
            ).values(),
        )
        const colors = generateColors({nOfColors: Math.max(categories.length, 4)})
        setCategoryColors(Object.fromEntries(categories.map((c, i) => [c, colors[i]])))
    }, [dayTasks])

    const createTask: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()

        void (async () => {
            const form = new FormData(event.target as HTMLFormElement)
            let time: string | undefined = form.get('time') as string
            time = time ? `${time}:00.000` : undefined

            const {data: _newTask, errors} = await client.models.DayTask.create({
                title: form.get('title') as string,
                category: form.get('category') as string,
                description: (form.get('description') as string) || undefined,
                list: currentList,
                time,
                priority: form.has('priority'),
                moveToTodayOn: undefined, // TODO
                enablePriorityOn: undefined, // TODO
                recurrence: {once: true}, // TODO

                // don't set these
                lastCompleted: undefined,
                id: undefined,
                owner: undefined,
            })

            console.log('CREATED', _newTask)
            errors && console.error('creation', errors)

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
            lastCompleted = null
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
                {({signOut, user}) => {
                    // console.log(_user)
                    setIsAuthenticated(true)
                    return (
                        <Flex className='App' justifyContent='center' alignItems='center' direction='column' width='70%' margin='0 auto'>
                            {showAdd ? (
                                <View as='form' onSubmit={createTask}>
                                    {/* TODO: Quebrar em componentes para código mais limpo e mais facil manutenção.  */}
                                    {/* AddTask Component */}
                                    <Heading level={2}>Adicionar</Heading>
                                    <Flex
                                        direction='column'
                                        justifyContent='center'
                                        gap='1rem'
                                        padding='2rem'
                                        style={{background: '#347'}}
                                        color={'#fff'}
                                        position={'relative'}
                                        width={'90vw'}
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
                                                // ['category', 'Categoria'],
                                                ['description', 'Descrição (opcional)'],
                                            ] satisfies [string, string][]
                                        ).map((input) => (
                                            <View position={'relative'}>
                                                {/* FloatingLabelInput */}
                                                <Label
                                                    key={`label${input[0]}`}
                                                    position={'absolute'}
                                                    top={'-0.6rem'}
                                                    left={'0.25rem'}
                                                    color={'#ddd'}
                                                    backgroundColor={'#347'}
                                                    style={{zIndex: 1}}
                                                    padding={'0 0.25rem'}
                                                    htmlFor={input[0]}
                                                    fontSize={'0.75rem'}
                                                >
                                                    {input[1]}
                                                </Label>
                                                <WhiteTextField
                                                    id={input[0]}
                                                    key={`input${input[0]}`}
                                                    name={input[0]}
                                                    placeholder={input[1]}
                                                    label={input[1]}
                                                    required={input[0] !== 'description'}
                                                    labelHidden
                                                />
                                            </View>
                                        ))}
                                        <View position={'relative'}>
                                            <Label
                                                position={'absolute'}
                                                top={'-0.6rem'}
                                                left={'0.25rem'}
                                                color={'#ddd'}
                                                backgroundColor={'#347'}
                                                style={{zIndex: 1}}
                                                padding={'0 0.25rem'}
                                                htmlFor={'category'}
                                                fontSize={'0.75rem'}
                                            >
                                                Categoria
                                            </Label>
                                            <WhiteAutocomplete
                                                options={(() => {
                                                    const ops = Object.entries(categoryColors).map(([category, color]) => ({
                                                        id: category,
                                                        label: category,
                                                        color: 'black',
                                                        backgroundColor: color?.offsetColor ?? '#fff',
                                                        fontWeight: '900',
                                                    }))
                                                    console.log('ops', ops)
                                                    return ops
                                                })()}
                                                id={'category'}
                                                name={'category'}
                                                placeholder={'Categoria'}
                                                label={'Categoria'}
                                                labelHidden
                                                required
                                                onChange={(e) => {
                                                    console.log('?', categoryColors[e.currentTarget.value])
                                                    setSelectedCategoryColor(categoryColors[e.currentTarget.value] ?? undefined)
                                                }}
                                                onSelect={(e) => {
                                                    console.log('?', e.id)
                                                    setSelectedCategoryColor(categoryColors[e.id] ?? undefined)
                                                }}
                                            />
                                        </View>
                                        <Flex wrap={'wrap'}>
                                            <View position={'relative'} flex={1}>
                                                <Label
                                                    position={'absolute'}
                                                    top={'-0.6rem'}
                                                    left={'0.25rem'}
                                                    color={'#ddd'}
                                                    backgroundColor={'#347'}
                                                    style={{zIndex: 1}}
                                                    padding={'0 0.25rem'}
                                                    htmlFor={'time'}
                                                    fontSize={'0.75rem'}
                                                >
                                                    {'Hora (opcional)'}
                                                </Label>
                                                <WhiteInput type={'time'} id={'time'} name={'time'} color={'#fff'} />
                                            </View>
                                            <SwitchField
                                                name={'priority'}
                                                label={'Prioridade'}
                                                flex={1}
                                                thumbColor={selectedCategoryColor?.offsetColor ?? '#111'}
                                                trackCheckedColor={selectedCategoryColor?.baseColor ?? '#777'}
                                                trackColor={'#eee'}
                                            />
                                        </Flex>
                                        <Button type='submit' variation='primary' backgroundColor={selectedCategoryColor?.offsetColor}>
                                            Criar
                                        </Button>
                                    </Flex>
                                </View>
                            ) : !selectedTask ? (
                                <Flex direction={'column'} gap={0}>
                                    {/* Component: TaskList */}
                                    <Heading level={4} backgroundColor={'#aaa'}>
                                        {ListTitles[currentList]} - {new Date().toLocaleDateString()}
                                    </Heading>
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
                                                    {dayTask.time && <Text>{dayTask.time.replace(':00.000', '')}</Text>}
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
                                                    color={dayTask.list === 'DONE' ? '#ddd' : '#333'}
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
                                {client.enums.Lists.values().map((list) => {
                                    const selected = currentList === list
                                    const disabled = selected || showAdd
                                    return (
                                        <Button
                                            key={list + 'selector'}
                                            onClick={() => {
                                                setCurrentList(list)
                                                setSelectedTask(undefined)
                                            }}
                                            color={selected ? '#fff' : '#000'}
                                            backgroundColor={selected ? '#347' : '#eee'}
                                            disabled={disabled}
                                            fontWeight={300}
                                            style={{cursor: disabled ? 'default' : 'pointer'}}
                                        >
                                            {ListTitles[list]}
                                        </Button>
                                    )
                                })}
                            </Flex>
                            <Button
                                onClick={() => {
                                    setIsAuthenticated(false)
                                    signOut && signOut()
                                }}
                                backgroundColor={'#333'}
                                color={'#aaa'}
                                fontWeight={300}
                                fontSize={'0.5rem'}
                            >
                                Sair da conta {user?.signInDetails?.loginId}
                            </Button>
                        </Flex>
                    )
                }}
            </Authenticator>
        </MVPContainer>
    )
}
