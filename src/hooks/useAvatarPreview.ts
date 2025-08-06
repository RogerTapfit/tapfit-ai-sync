import { useReducer, useCallback } from 'react';
import { RobotAvatarData } from './useRobotAvatar';

interface AvatarState {
  current: RobotAvatarData;
  preview: RobotAvatarData;
  isSaving: boolean;
  lastSaved: RobotAvatarData;
  error: string | null;
  hasUnsavedChanges: boolean;
}

type AvatarAction = 
  | { type: 'INITIALIZE'; payload: RobotAvatarData }
  | { type: 'PREVIEW_UPDATE'; payload: Partial<RobotAvatarData> }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; payload: RobotAvatarData }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' };

const avatarReducer = (state: AvatarState, action: AvatarAction): AvatarState => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        current: action.payload,
        preview: action.payload,
        lastSaved: action.payload,
        isSaving: false,
        error: null,
        hasUnsavedChanges: false
      };

    case 'PREVIEW_UPDATE':
      const updatedPreview = { ...state.preview, ...action.payload };
      return {
        ...state,
        preview: updatedPreview,
        hasUnsavedChanges: JSON.stringify(updatedPreview) !== JSON.stringify(state.lastSaved),
        error: null
      };

    case 'SAVE_START':
      return {
        ...state,
        isSaving: true,
        error: null
      };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        current: action.payload,
        lastSaved: action.payload,
        isSaving: false,
        hasUnsavedChanges: false,
        error: null
      };

    case 'SAVE_ERROR':
      return {
        ...state,
        isSaving: false,
        error: action.payload,
        // Revert preview to last saved state on error
        preview: state.lastSaved,
        hasUnsavedChanges: false
      };

    case 'RESET':
      return {
        ...state,
        preview: state.lastSaved,
        hasUnsavedChanges: false,
        error: null
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

export const useAvatarPreview = (initialData: RobotAvatarData | null) => {
  const [state, dispatch] = useReducer(avatarReducer, {
    current: initialData || {} as RobotAvatarData,
    preview: initialData || {} as RobotAvatarData,
    lastSaved: initialData || {} as RobotAvatarData,
    isSaving: false,
    error: null,
    hasUnsavedChanges: false
  });

  const initializeAvatar = useCallback((avatarData: RobotAvatarData) => {
    dispatch({ type: 'INITIALIZE', payload: avatarData });
  }, []);

  const updatePreview = useCallback((updates: Partial<RobotAvatarData>) => {
    dispatch({ type: 'PREVIEW_UPDATE', payload: updates });
  }, []);

  const startSave = useCallback(() => {
    dispatch({ type: 'SAVE_START' });
  }, []);

  const completeSave = useCallback((savedData: RobotAvatarData) => {
    dispatch({ type: 'SAVE_SUCCESS', payload: savedData });
  }, []);

  const failSave = useCallback((error: string) => {
    dispatch({ type: 'SAVE_ERROR', payload: error });
  }, []);

  const resetToSaved = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return {
    // State
    avatarData: state.preview,
    isSaving: state.isSaving,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,
    
    // Actions
    initializeAvatar,
    updatePreview,
    startSave,
    completeSave,
    failSave,
    resetToSaved,
    clearError
  };
};