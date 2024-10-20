import { MessageContext } from 'contexts/MessageContext';
import { useContext, useState } from 'react';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import {
  firstUserInteraction,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import Dialog from 'components/atoms/Dialog';
import { AccentButton } from 'components/atoms/buttons/AccentButton';
import { TextInput } from 'components/atoms/inputs';

import MessageBubbleIcon, {
  MessageBubbleFilledIcon
} from 'assets/messageBubble';
import {
  ThumbDownFilledIcon,
  ThumbDownIcon,
  ThumbUpFilledIcon,
  ThumbUpIcon
} from 'assets/thumbs';

import type { IStep } from 'client-types/';

const ICON_SIZE = '16px';

interface Props {
  message: IStep;
}

const FeedbackButtons = ({ message }: Props) => {
  const config = useConfig();
  const { onFeedbackUpdated, onFeedbackDeleted } = useContext(MessageContext);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<number>();
  const [commentInput, setCommentInput] = useState<string>();
  const firstInteraction = useRecoilValue(firstUserInteraction);
  const { idToResume } = useChatSession();

  const [feedback, setFeedback] = useState(message.feedback?.value);
  const [comment, setComment] = useState(message.feedback?.comment);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [_pendingFeedbackRemoval, setPendingFeedbackRemoval] = useState<
    number | undefined
  >();

  if (!config.config?.dataPersistence) {
    return null;
  }

  const DownIcon = feedback === -1 ? ThumbDownFilledIcon : ThumbDownIcon;
  const UpIcon = feedback === 1 ? ThumbUpFilledIcon : ThumbUpIcon;
  const BubbleIcon =
    feedback === 0 ? MessageBubbleFilledIcon : MessageBubbleIcon;

  const handleFeedbackChanged = (feedback?: number, comment?: string) => {
    if (feedback === undefined) {
      if (onFeedbackDeleted && message.feedback?.id) {
        onFeedbackDeleted(
          message,
          () => {
            setFeedback(undefined);
            setComment(undefined);
          },
          message.feedback.id
        );
      }
    } else if (onFeedbackUpdated) {
      onFeedbackUpdated(
        message,
        () => {
          setFeedback(feedback);
          setComment(comment);
        },
        {
          ...(message.feedback || {}),
          forId: message.id,
          threadId: message.threadId,
          value: feedback,
          comment
        }
      );
    }
  };

  const handleFeedbackClick = (nextValue: number) => {
    if (nextValue === 0) {
      // Open comment dialog for neutral feedback
      setShowFeedbackDialog(0);
      setCommentInput(comment || undefined);
    } else if (feedback === nextValue) {
      if (comment) {
        setShowConfirmDialog(true);
        setPendingFeedbackRemoval(nextValue);
      } else {
        handleFeedbackChanged(undefined);
      }
    } else {
      setShowFeedbackDialog(nextValue);
      setCommentInput(comment || undefined);
    }
  };

  const isPersisted = firstInteraction || idToResume;
  const isStreaming = !!message.streaming;

  const disabled = isStreaming || !isPersisted;

  const buttons = useMemo(() => {
    const iconSx = {
      width: ICON_SIZE,
      height: ICON_SIZE
    };

    const baseButtons = [
      () => (
        <Tooltip title="Helpful">
          <span>
            <IconButton
              color="inherit"
              disabled={disabled}
              className={`positive-feedback-${feedback === 1 ? 'on' : 'off'}`}
              onClick={() => handleFeedbackClick(1)}
            >
              <UpIcon sx={iconSx} />
            </IconButton>
          </span>
        </Tooltip>
      ),
      () => (
        <Tooltip title="Add comment">
          <span>
            <IconButton
              color="inherit"
              disabled={disabled}
              className={`neutral-feedback-${feedback === 0 ? 'on' : 'off'}`}
              onClick={() => handleFeedbackClick(0)}
            >
              <BubbleIcon sx={iconSx} />
            </IconButton>
          </span>
        </Tooltip>
      ),
      () => (
        <Tooltip title="Not helpful">
          <span>
            <IconButton
              color="inherit"
              disabled={disabled}
              className={`negative-feedback-${feedback === -1 ? 'on' : 'off'}`}
              onClick={() => handleFeedbackClick(-1)}
            >
              <DownIcon sx={iconSx} />
            </IconButton>
          </span>
        </Tooltip>
      )
    ];

    return baseButtons;
  }, [feedback, disabled, UpIcon, BubbleIcon, DownIcon]);

  return (
    <>
      <Stack direction="row">
        {buttons.map((FeedbackButton, index) => (
          <FeedbackButton key={`feedback-button-${index}`} />
        ))}
      </Stack>

      <Dialog
        maxWidth="xs"
        onClose={() => {
          setShowFeedbackDialog(undefined);
        }}
        open={showFeedbackDialog !== undefined}
        title={
          <Stack direction="row" alignItems="center" gap={2}>
            {showFeedbackDialog === -1 ? (
              <DownIcon />
            ) : showFeedbackDialog === 1 ? (
              <UpIcon />
            ) : (
              <MessageBubbleIcon />
            )}
            {showFeedbackDialog === 0 ? 'Add a comment' : 'Add feedback'}
          </Stack>
        }
        content={
          <TextInput
            id="feedbackDescription"
            value={commentInput}
            multiline
            size="medium"
            onChange={(e) => {
              if (e.target.value === '') {
                setCommentInput(undefined);
              } else {
                setCommentInput(e.target.value);
              }
            }}
          />
        }
        actions={
          <AccentButton
            id="feedbackSubmit"
            type="submit"
            variant="outlined"
            onClick={() => {
              handleFeedbackChanged(showFeedbackDialog, commentInput);
              setShowFeedbackDialog(undefined);
              setCommentInput(undefined);
            }}
            autoFocus
          >
            Submit
          </AccentButton>
        }
      />

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Remove Feedback"
        content="Are you sure you want to remove your feedback and associated comment?"
        actions={
          <>
            <AccentButton onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AccentButton>
            <AccentButton
              onClick={() => {
                handleFeedbackChanged(undefined);
                setShowConfirmDialog(false);
              }}
            >
              Confirm
            </AccentButton>
          </>
        }
      />
    </>
  );
};

export { FeedbackButtons };
