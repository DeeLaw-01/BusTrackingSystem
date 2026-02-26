import mongoose, { Document, Schema } from 'mongoose'

import { IStop } from '../types/route.types'

export interface IStopDocument
  extends Omit<IStop, '_id' | 'routeId'>,
    Document {
  routeId: mongoose.Types.ObjectId
}

const stopSchema = new Schema<IStopDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    estimatedArrivalTime: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes
stopSchema.index({ routeId: 1, sequence: 1 })
stopSchema.index({ routeId: 1 })

const Stop = mongoose.model<IStopDocument>('Stop', stopSchema)

export default Stop
