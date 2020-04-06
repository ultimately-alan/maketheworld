import { Auth, API, graphqlOperation } from 'aws-amplify'
import { getPlayerCharacters, getCharactersInPlay } from '../graphql/queries'
import {
    putCharacter as putCharacterGraphQL,
    addCharacterInPlay as addCharacterInPlayGraphQL
} from '../graphql/mutations'
import { changedCharacter, changedCharactersInPlay } from '../graphql/subscriptions'

import { closeMyCharacterDialog } from './UI/myCharacterDialog'
import { addSubscription } from './subscriptions'

export const FETCH_MY_CHARACTERS_SUCCESS = 'FETCH_MY_CHARACTERS_SUCCESS'
export const FETCH_MY_CHARACTERS_ATTEMPT = 'FETCH_MY_CHARACTERS_ATTEMPT'
export const PUT_MY_CHARACTER_SUCCESS = 'PUT_MY_CHARACTER_SUCCESS'
export const RECEIVE_MY_CHARACTER_CHANGE = 'RECEIVE_MY_CHARACTER_CHANGE'
export const FETCH_CHARACTERS_IN_PLAY_ATTEMPT = 'FETCH_CHARACTER_IN_PLAY_ATTEMPT'
export const FETCH_CHARACTERS_IN_PLAY_SUCCESS = 'FETCH_CHARACTERS_IN_PLAY_SUCCESS'
export const RECEIVE_CHARACTERS_IN_PLAY_CHANGE = 'RECEIVE_CHARACTERS_IN_PLAY_CHANGE'

export const fetchMyCharactersAttempt = () => ({
    type: FETCH_MY_CHARACTERS_ATTEMPT
})

export const fetchMyCharactersSuccess = (payload) => ({
    type: FETCH_MY_CHARACTERS_SUCCESS,
    payload
})

export const fetchMyCharacters = () => (dispatch, getState) => {
    const { myCharacters } = getState()

    if (!(myCharacters && myCharacters.meta && myCharacters.meta.fetching)){
        dispatch(fetchMyCharactersAttempt())
        return API.graphql(graphqlOperation(getPlayerCharacters))
            .then(({ data }) => (data || {}))
            .then(({ getPlayerCharacters }) => (getPlayerCharacters || []))
            .then((payload) => (dispatch(fetchMyCharactersSuccess(payload))))
    }
}

export const putMyCharacterSuccess = (payload) => ({
    type: PUT_MY_CHARACTER_SUCCESS,
    payload
})

export const putMyCharacter = ({
    name = '',
    characterId = '',
    pronouns = '',
    firstImpression = '',
    outfit = '',
    oneCoolThing = ''
}) => (dispatch) => {
    return API.graphql(graphqlOperation(putCharacterGraphQL, {
            Name: name,
            ...(characterId ? { CharacterId: characterId ? characterId : null } : {}),
            ...(pronouns ? { Pronouns: pronouns ? pronouns : null } : {}),
            ...(firstImpression ? { FirstImpression: firstImpression ? firstImpression : null } : {}),
            ...(pronouns ? { Outfit: outfit ? outfit : null } : {}),
            ...(oneCoolThing ? { OneCoolThing: oneCoolThing ? oneCoolThing : null } : {})
        }))
        .then((payload) => {
            dispatch(putMyCharacterSuccess(payload))
        })
}

export const putMyCharacterAndCloseDialog = (characterData) => (dispatch) => {
    return dispatch(putMyCharacter(characterData))
        .then(() => {
            dispatch(closeMyCharacterDialog())
        })
}

export const receiveMyCharacterChange = (payload) => ({
    type: RECEIVE_MY_CHARACTER_CHANGE,
    payload
})

export const subscribeMyCharacterChanges = () => (dispatch) => {
    const subscription = API.graphql(graphqlOperation(changedCharacter))
        .subscribe({
            next: (characterData) => {
                const { value = {} } = characterData
                const { data = {} } = value
                const { changedCharacter = {} } = data
                const { PlayerName } = changedCharacter
                if (PlayerName) {
                    Auth.currentAuthenticatedUser()
                        .then(({ username = '' }) => {
                            if (username === PlayerName) {
                                dispatch(receiveMyCharacterChange(changedCharacter))
                            }
                        })
                        .catch()
                }
            }
        })
    return addSubscription({ myCharacter: subscription })
}

export const fetchCharactersInPlayAttempt = () => ({
    type: FETCH_CHARACTERS_IN_PLAY_ATTEMPT
})

export const fetchCharactersInPlaySuccess = (payload) => ({
    type: FETCH_CHARACTERS_IN_PLAY_SUCCESS,
    payload
})

export const fetchCharactersInPlay = () => (dispatch, getState) => {
    const { characters } = getState()

    if (!(characters && characters.meta && characters.meta.fetching)){
        dispatch(fetchCharactersInPlayAttempt())
        return API.graphql(graphqlOperation(getCharactersInPlay))
            .then(({ data }) => (data || {}))
            .then(({ getCharactersInPlay }) => (getCharactersInPlay || []))
            .then((payload) => (dispatch(fetchCharactersInPlaySuccess(payload))))
    }
}

export const addCharacterInPlay = ({ characterId, connectionId }) => (dispatch, getState) => {
    return API.graphql(graphqlOperation(addCharacterInPlayGraphQL, {
        CharacterId: characterId,
        ConnectionId: connectionId
    }))
}

export const receiveCharactersInPlayChange = (payload) => ({
    type: RECEIVE_CHARACTERS_IN_PLAY_CHANGE,
    payload
})


export const subscribeCharactersInPlayChanges = () => (dispatch) => {
    const subscription = API.graphql(graphqlOperation(changedCharactersInPlay))
        .subscribe({
            next: (characterData) => {
                const { value = {} } = characterData
                const { data = {} } = value
                const { changedCharactersInPlay = {} } = data
                dispatch(receiveCharactersInPlayChange(changedCharactersInPlay))
            }
        })
    return addSubscription({ charactersInPlay: subscription })
}
